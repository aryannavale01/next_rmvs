import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { updatePartnerSchema } from '@/lib/validations/admin-partner';
import { logActivity } from '@/lib/activity-log';

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
    const partner = await withRetry(() => prisma.partner.findUnique({ where: { id } }));
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }
    return NextResponse.json(partner);
  } catch (error) {
    console.error('[GET /api/admin/partners/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch partner' }, { status: 500 });
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
    const parsed = updatePartnerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await withRetry(() => prisma.partner.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const updated = await withRetry(() => prisma.partner.update({ where: { id }, data: parsed.data }));

    await logActivity({
      entity: 'partner',
      entityId: id,
      action: 'partner_update',
      description: `Updated partner "${updated.name}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/admin/partners/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 });
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
    const existing = await withRetry(() => prisma.partner.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    await withRetry(() => prisma.partner.update({ where: { id }, data: { status: 'deleted', deletedAt: new Date() } }));

    await logActivity({
      entity: 'partner',
      entityId: id,
      action: 'partner_delete',
      description: `Deleted partner "${existing.name}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/partners/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to delete partner' }, { status: 500 });
  }
}
