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

    const existing = await withRetry(() => prisma.teacher.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    if (existing.status !== 'deleted') {
      return NextResponse.json(
        { error: 'Teacher is not deleted' },
        { status: 400 },
      );
    }

    const updated = await withRetry(() =>
      prisma.teacher.update({
        where: { id },
        data: { status: 'active' },
      }),
    );

    await logActivity({
      entity: 'teacher',
      entityId: id,
      action: 'restore',
      description: `Restored teacher ${existing.fullName} (${existing.email})`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({
      message: 'Teacher restored',
      id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error('[PATCH /api/admin/teachers/[id]/restore]', error);
    return NextResponse.json(
      { error: 'Failed to restore teacher' },
      { status: 500 },
    );
  }
}
