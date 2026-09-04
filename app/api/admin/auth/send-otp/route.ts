import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, authErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
import { sendAdminOtp } from '@/lib/admin-otp';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'admin-otp-send', 3, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many code requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    );
  }

  const auth = await requireAdmin();
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  const user = auth.session.user;
  const ip = getClientIP(request);

  try {
    const userRow = await withRetry(() =>
      prisma.user.findUnique({
        where: { id: user.id },
        select: { email: true, name: true },
      })
    );

    if (!userRow?.email) {
      return NextResponse.json({ error: 'Account email not found' }, { status: 400 });
    }

    const { success, maskedEmail } = await sendAdminOtp({
      userId: user.id,
      email: userRow.email,
      userName: userRow.name || user.name,
      ip,
    });

    // Do NOT reveal whether the email went out — always report success-shaped
    // 200 so this endpoint cannot be used to enumerate accounts.
    return NextResponse.json({ ok: true, delivered: success, email: maskedEmail });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
