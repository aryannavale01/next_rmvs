import { NextRequest, NextResponse } from 'next/server';
import { requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  const rateLimit = checkRateLimit(request, 'admin_revoke_all_sessions', 3, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { excludeCurrentSession = true } = body as { excludeCurrentSession?: boolean };

    let deleted;
    if (excludeCurrentSession) {
      deleted = await withRetry(() =>
        prisma.session.deleteMany({
          where: { id: { not: auth.session.session.id } },
        }),
      );
    } else {
      deleted = await withRetry(() => prisma.session.deleteMany({}));
    }

    await logActivity({
      entity: 'member',
      entityId: 'global',
      action: 'update',
      description: `Global session revocation: ${deleted.count} sessions deleted${excludeCurrentSession ? ' (current session preserved)' : ''}`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({
      message: 'All sessions revoked',
      sessionsRevoked: deleted.count,
    });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error('[POST /api/admin/sessions/revoke-all]', error);
    return NextResponse.json({ error: 'Failed to revoke sessions' }, { status: 500 });
  }
}
