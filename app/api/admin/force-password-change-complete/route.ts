import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { logAuthEvent, AuditActions } from '@/lib/audit-log';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'force-password-change', 3, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
  }

  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.session.user.id },
      select: { mustChangePassword: true },
    });

    if (!user?.mustChangePassword) {
      return NextResponse.json({ error: 'No password change required' }, { status: 400 });
    }

    const currentSessionId = auth.session.session.id;
    await prisma.$transaction([
      prisma.user.update({
        where: { id: auth.session.user.id },
        data: { mustChangePassword: false },
      }),
      prisma.session.deleteMany({
        where: {
          userId: auth.session.user.id,
          id: { not: currentSessionId },
        },
      }),
    ]);

    await logAuthEvent({
      userId: auth.session.user.id,
      action: AuditActions.PASSWORD_CHANGE_FORCED,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to complete password change' }, { status: 500 });
  }
}
