import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { upsertSiteSettingSchema } from '@/lib/validations/admin-site-setting';
import { logActivity } from '@/lib/activity-log';
import { invalidateOrgConfig } from '@/lib/org-config';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  category: z.string().optional(),
  search:   z.string().optional(),
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  sortBy:   z.enum(['key', 'label', 'category', 'createdAt']).default('category'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
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
    const where: Prisma.SiteSettingWhereInput = {};
    if (q.category) where.category = q.category;
    if (q.search) {
      where.OR = [
        { key: { contains: q.search, mode: 'insensitive' } },
        { label: { contains: q.search, mode: 'insensitive' } },
        { value: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const skip = (q.page - 1) * q.pageSize;
    const [data, total] = await withRetry(() =>
      Promise.all([
        prisma.siteSetting.findMany({ where, orderBy: { [q.sortBy]: q.sortOrder }, skip, take: q.pageSize }),
        prisma.siteSetting.count({ where }),
      ]),
    );

    return NextResponse.json({
      data,
      pagination: { page: q.page, pageSize: q.pageSize, total, totalPages: Math.ceil(total / q.pageSize) },
    });
  } catch (error) {
    console.error('[GET /api/admin/site-settings]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch site settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const body = await request.json();
    const parsed = upsertSiteSettingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { key, ...data } = parsed.data;

    const setting = await withRetry(() =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, ...data },
        update: { ...data },
      }),
    );

    await logActivity({
      entity: 'site_setting',
      entityId: setting.id,
      action: 'site_setting_upsert',
      description: `Upserted site setting "${setting.label}" (key: ${setting.key})`,
      performedBy: auth.session.user.id,
    });

    invalidateOrgConfig();

    return NextResponse.json(setting, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/site-settings]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to upsert site setting' }, { status: 500 });
  }
}
