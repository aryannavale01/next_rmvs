import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { updateSiteSettingSchema } from '@/lib/validations/admin-site-setting';
import { logActivity } from '@/lib/activity-log';
import { invalidateOrgConfig } from '@/lib/org-config';
import { isValidBrandColor } from '@/lib/brand-color';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const setting = await withRetry(() => prisma.siteSetting.findUnique({ where: { id } }));
    if (!setting) {
      return NextResponse.json({ error: 'Site setting not found' }, { status: 404 });
    }
    return NextResponse.json(setting);
  } catch (error) {
    console.error('[GET /api/admin/site-settings/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch site setting' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSiteSettingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await withRetry(() => prisma.siteSetting.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Site setting not found' }, { status: 404 });
    }

    if (
      existing.key === 'appearance.brandColor' &&
      parsed.data.value !== undefined &&
      !isValidBrandColor(parsed.data.value)
    ) {
      return NextResponse.json(
        { error: 'Invalid input', details: { value: ['Brand color must be a valid hex color like #2563EB'] } },
        { status: 400 },
      );
    }

    const updated = await withRetry(() => prisma.siteSetting.update({ where: { id }, data: parsed.data }));

    await logActivity({
      entity: 'site_setting',
      entityId: id,
      action: 'site_setting_upsert',
      description: `Updated site setting "${updated.label}" (key: ${updated.key})`,
      performedBy: auth.session.user.id,
    });

    invalidateOrgConfig();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/admin/site-settings/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to update site setting' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const { id } = await params;
    const existing = await withRetry(() => prisma.siteSetting.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Site setting not found' }, { status: 404 });
    }

    await withRetry(() => prisma.siteSetting.delete({ where: { id } }));

    await logActivity({
      entity: 'site_setting',
      entityId: id,
      action: 'site_setting_delete',
      description: `Deleted site setting "${existing.label}" (key: ${existing.key})`,
      performedBy: auth.session.user.id,
    });

    invalidateOrgConfig();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/site-settings/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to delete site setting' }, { status: 500 });
  }
}
