import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { createTestimonialSchema } from '@/lib/validations/admin-testimonial';
import { logActivity } from '@/lib/activity-log';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  search:         z.string().optional(),
  courseId:       z.string().optional(),
  page:           z.coerce.number().int().min(1).default(1),
  pageSize:       z.coerce.number().int().min(1).max(100).default(20),
  sortBy:         z.enum(['name', 'rating', 'createdAt']).default('createdAt'),
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
    const where: Prisma.TestimonialWhereInput = {};
    where.status = { not: 'deleted' };
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { quote: { contains: q.search, mode: 'insensitive' } },
        { role: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    if (q.courseId) where.courseId = q.courseId;

    const skip = (q.page - 1) * q.pageSize;
    const [data, total] = await withRetry(() =>
      Promise.all([
        prisma.testimonial.findMany({
          where,
          orderBy: { [q.sortBy]: q.sortOrder },
          skip,
          take: q.pageSize,
          include: { course: { select: { id: true, title: true } } },
        }),
        prisma.testimonial.count({ where }),
      ]),
    );

    return NextResponse.json({
      data,
      pagination: { page: q.page, pageSize: q.pageSize, total, totalPages: Math.ceil(total / q.pageSize) },
    });
  } catch (error) {
    console.error('[GET /api/admin/testimonials]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const body = await request.json();
    const parsed = createTestimonialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const testimonial = await withRetry(() => prisma.testimonial.create({ data: parsed.data }));

    await logActivity({
      entity: 'testimonial',
      entityId: testimonial.id,
      action: 'testimonial_create',
      description: `Created testimonial from "${testimonial.name}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(testimonial, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/testimonials]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
  }
}
