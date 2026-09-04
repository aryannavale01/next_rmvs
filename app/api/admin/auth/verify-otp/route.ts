import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, authErrorResponse } from '@/lib/session';
import { dbErrorResponse } from '@/lib/prisma';
import { verifyAdminOtp } from '@/lib/admin-otp';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'admin-otp-verify', 10, 15 * 60 * 1000);
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

  const user = auth.session.user;
  const ip = getClientIP(request);

  try {
    const body = await request.json();
    const { code } = body;

    if (typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const result = await verifyAdminOtp({
      userId: user.id,
      email: user.email,
      code,
      sessionId: auth.session.session.id,
      ip,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
