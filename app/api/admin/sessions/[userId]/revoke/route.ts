import { NextRequest, NextResponse } from 'next/server';
import { requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const { userId } = await params;

    const user = await withRetry(() =>
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true } }),
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'ADMIN' && userId === auth.session.user.id) {
      return NextResponse.json({ error: 'Cannot revoke your own sessions' }, { status: 400 });
    }

    const deleted = await withRetry(() =>
      prisma.session.deleteMany({ where: { userId } }),
    );

    await logActivity({
      entity: 'member',
      entityId: userId,
      action: 'update',
      description: `Revoked all sessions for user ${user.email} (${deleted.count} sessions)`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({
      message: 'All sessions revoked',
      userId,
      sessionsRevoked: deleted.count,
    });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error('[POST /api/admin/sessions/[userId]/revoke]', error);
    return NextResponse.json({ error: 'Failed to revoke sessions' }, { status: 500 });
  }
}
