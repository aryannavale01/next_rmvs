import { NextRequest, NextResponse } from 'next/server';
import { requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
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

    if (existing.status !== 'deleted') {
      return NextResponse.json(
        { error: 'Leader is not deleted' },
        { status: 400 },
      );
    }

    const updated = await withRetry(() =>
      prisma.leader.update({
        where: { id },
        data: { status: 'active' },
      }),
    );

    await logActivity({
      entity: 'leader',
      entityId: id,
      action: 'restore',
      description: `Restored leader "${existing.name}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({
      message: 'Leader restored',
      id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error('[PATCH /api/admin/leaders/[id]/restore]', error);
    return NextResponse.json(
      { error: 'Failed to restore leader' },
      { status: 500 },
    );
  }
}
