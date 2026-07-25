import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { STEP_UP_WINDOW_MS } from '@/lib/admin-security';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await prisma.session.findUnique({
    where: { id: auth.session.session.id },
    select: { stepUpVerifiedAt: true },
  });

  const needsStepUp =
    !session?.stepUpVerifiedAt ||
    Date.now() - session.stepUpVerifiedAt.getTime() > STEP_UP_WINDOW_MS;

  return NextResponse.json({
    needsStepUp,
    stepUpVerifiedAt: session?.stepUpVerifiedAt?.toISOString() || null,
  });
}
