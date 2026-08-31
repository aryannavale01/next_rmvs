import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, authErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
import { verifyPassword } from '@better-auth/utils/password';
import { logAuthEvent, AuditActions } from '@/lib/audit-log';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'step-up', 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
  }

  const auth = await requireAdmin();
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const account = await withRetry(() =>
      prisma.account.findFirst({
        where: {
          userId: auth.session.user.id,
          providerId: 'credential',
        },
        select: { password: true },
      })
    );

    if (!account?.password) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 400 });
    }

    const valid = await verifyPassword(account.password, password);

    if (!valid) {
      await logAuthEvent({
        userId: auth.session.user.id,
        action: AuditActions.STEP_UP_FAILED,
        ip: getClientIP(request),
      });
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    await withRetry(() =>
      prisma.session.update({
        where: { id: auth.session.session.id },
        data: { stepUpVerifiedAt: new Date() },
      })
    );

    await logAuthEvent({
      userId: auth.session.user.id,
      action: AuditActions.STEP_UP_VERIFIED,
      ip: getClientIP(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
