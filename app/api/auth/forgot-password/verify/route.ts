import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPasswordResetOtp } from '@/lib/reset-password';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

const bodySchema = z.object({
  email: z.string().email().max(254),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

/**
 * Step 2 of the forgot-password flow — verify the email + OTP. On success
 * returns a single-use reset token used by the /reset-password endpoint.
 */
export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'forgot-password-verify', 10, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  let email: string;
  let code: string;
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid code.' }, { status: 400 });
    }
    email = parsed.data.email;
    code = parsed.data.code;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const ip = getClientIP(request);

  const result = await verifyPasswordResetOtp({ email, code, ip });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, resetToken: result.resetToken });
}
