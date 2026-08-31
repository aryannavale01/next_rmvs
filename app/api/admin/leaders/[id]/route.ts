import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { updateLeaderSchema } from '@/lib/validations/admin-leader';
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
    const leader = await withRetry(() => prisma.leader.findUnique({ where: { id } }));
    if (!leader) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }
    return NextResponse.json(leader);
  } catch (error) {
    console.error('[GET /api/admin/leaders/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch leader' }, { status: 500 });
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
    const parsed = updateLeaderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await withRetry(() => prisma.leader.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }

    const updated = await withRetry(() => prisma.leader.update({ where: { id }, data: parsed.data }));

    await logActivity({
      entity: 'leader',
      entityId: id,
      action: 'leader_update',
      description: `Updated leader "${updated.name}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/admin/leaders/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to update leader' }, { status: 500 });
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
    const existing = await withRetry(() => prisma.leader.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }

    if (existing.status === 'deleted') {
      return NextResponse.json({ error: 'Leader is already deleted' }, { status: 400 });
    }

    await withRetry(() => prisma.leader.update({ where: { id }, data: { status: 'deleted' } }));

    await logActivity({
      entity: 'leader',
      entityId: id,
      action: 'leader_delete',
      description: `Soft-deleted leader "${existing.name}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({ success: true, id, status: 'deleted' });
  } catch (error) {
    console.error('[DELETE /api/admin/leaders/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to delete leader' }, { status: 500 });
  }
}
