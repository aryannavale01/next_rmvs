import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';

export const dynamic = 'force-dynamic';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const { id } = await params;

    const existing = await withRetry(() => prisma.profile.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (existing.status !== 'deleted') {
      return NextResponse.json(
        { error: 'Member is not deleted' },
        { status: 400 },
      );
    }

    const updated = await withRetry(() =>
      prisma.profile.update({
        where: { id },
        data: { status: 'active' },
      })
    );

    await logActivity({
      entity: 'member',
      entityId: id,
      action: 'restore',
      description: `Restored member ${existing.fullName} (${existing.email})`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({
      message: 'Member restored',
      id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error('[PATCH /api/admin/members/[id]/restore]', error);
    return NextResponse.json(
      { error: 'Failed to restore member' },
      { status: 500 },
    );
  }
}
