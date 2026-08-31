import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { createLeaderSchema } from '@/lib/validations/admin-leader';
import { logActivity } from '@/lib/activity-log';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  search:         z.string().optional(),
  status:         z.string().optional(),
  includeDeleted: z.coerce.boolean().optional(),
  page:           z.coerce.number().int().min(1).default(1),
  pageSize:       z.coerce.number().int().min(1).max(100).default(20),
  sortBy:         z.enum(['name', 'role', 'department', 'createdAt']).default('createdAt'),
  sortOrder:      z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = QuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const q = parsed.data;
    const where: Prisma.LeaderWhereInput = {};
    if (q.status) {
      where.status = q.status as 'active' | 'inactive' | 'deleted';
    } else if (!q.includeDeleted) {
      where.status = { not: 'deleted' };
    }
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { role: { contains: q.search, mode: 'insensitive' } },
        { department: { contains: q.search, mode: 'insensitive' } },
        { bio: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const skip = (q.page - 1) * q.pageSize;
    const [data, total] = await withRetry(() =>
      Promise.all([
        prisma.leader.findMany({ where, orderBy: { [q.sortBy]: q.sortOrder }, skip, take: q.pageSize }),
        prisma.leader.count({ where }),
      ]),
    );

    return NextResponse.json({
      data,
      pagination: { page: q.page, pageSize: q.pageSize, total, totalPages: Math.ceil(total / q.pageSize) },
    });
  } catch (error) {
    console.error('[GET /api/admin/leaders]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch leaders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const body = await request.json();
    const parsed = createLeaderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const leader = await withRetry(() => prisma.leader.create({ data: parsed.data }));

    await logActivity({
      entity: 'leader',
      entityId: leader.id,
      action: 'leader_create',
      description: `Created leader "${leader.name}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(leader, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/leaders]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to create leader' }, { status: 500 });
  }
}
