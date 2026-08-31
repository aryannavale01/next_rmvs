import { NextResponse } from 'next/server';
import { requireAdmin, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
import { getStepUpWindowMs } from '@/lib/admin-security';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const [session, stepUpWindowMs] = await Promise.all([
      withRetry(() =>
        prisma.session.findUnique({
          where: { id: auth.session.session.id },
          select: { stepUpVerifiedAt: true },
        })
      ),
      getStepUpWindowMs(),
    ]);

    const needsStepUp =
      !session?.stepUpVerifiedAt ||
      Date.now() - session.stepUpVerifiedAt.getTime() > stepUpWindowMs;

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
