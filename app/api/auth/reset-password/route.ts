import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resetPasswordWithToken } from '@/lib/reset-password';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

const bodySchema = z.object({
  resetToken: z.string().min(32).max(128),
  newPassword: z.string().min(8).max(128),
});

/**
 * Step 3 of the forgot-password flow — set a new password using the reset
 * token obtained after a successful OTP verification.
 */
export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'forgot-password-reset', 10, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  let resetToken: string;
  let newPassword: string;
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }
    resetToken = parsed.data.resetToken;
    newPassword = parsed.data.newPassword;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const ip = getClientIP(request);

  const result = await resetPasswordWithToken({ resetToken, newPassword, ip });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
