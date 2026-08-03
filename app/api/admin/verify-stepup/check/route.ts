import { NextResponse } from 'next/server';
import { requireAdmin, authErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
import { STEP_UP_WINDOW_MS } from '@/lib/admin-security';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  try {
    const session = await withRetry(() =>
      prisma.session.findUnique({
        where: { id: auth.session.session.id },
        select: { stepUpVerifiedAt: true },
      })
    );

    const needsStepUp =
      !session?.stepUpVerifiedAt ||
      Date.now() - session.stepUpVerifiedAt.getTime() > STEP_UP_WINDOW_MS;

    return NextResponse.json({
      needsStepUp,
      stepUpVerifiedAt: session?.stepUpVerifiedAt?.toISOString() || null,
    });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    return NextResponse.json({ error: 'Failed to check step-up status' }, { status: 500 });
  }
}
