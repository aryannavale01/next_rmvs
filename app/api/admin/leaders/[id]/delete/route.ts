import { NextRequest, NextResponse } from 'next/server';
import { requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';

export const dynamic = 'force-dynamic';

export async function PATCH(
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
      return NextResponse.json(
        { error: 'Leader is already deleted' },
        { status: 400 },
      );
    }

    const updated = await withRetry(() =>
      prisma.leader.update({
        where: { id },
        data: { status: 'deleted' },
      }),
    );

    await logActivity({
      entity: 'leader',
      entityId: id,
      action: 'delete',
      description: `Soft-deleted leader "${existing.name}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({
      message: 'Leader soft-deleted',
      id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    console.error('[PATCH /api/admin/leaders/[id]/delete]', error);
    return NextResponse.json(
      { error: 'Failed to delete leader' },
      { status: 500 },
    );
  }
}
