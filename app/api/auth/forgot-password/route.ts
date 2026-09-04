import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requestPasswordResetOtp } from '@/lib/reset-password';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

const bodySchema = z.object({
  email: z.string().email().max(254),
});

/**
 * Step 1 of the forgot-password flow — email a 6-digit reset OTP.
 * Always returns 200 (regardless of whether the account exists) so that this
 * endpoint cannot be used to enumerate registered emails.
 */
export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'forgot-password-send', 3, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  let email: string;
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    email = parsed.data.email;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const ip = getClientIP(request);

  try {
    await requestPasswordResetOtp({ email, ip });
    // Always report "sent" even for unknown addresses (anti-enumeration).
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[forgot-password] Failed to request reset:', error);
    return NextResponse.json(
      { ok: true },
      { status: 500, headers: { 'X-Should-Retry': 'true' } },
    );
  }
}
