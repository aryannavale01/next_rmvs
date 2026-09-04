import { NextRequest, NextResponse } from 'next/server';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CheckEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'public_check_email', 20, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = CheckEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Look up the auth User table (not the beneficiary Profile) since the
    // account is what matters for duplicate registration.
    const existing = await withRetry(() =>
      prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } }),
    );

    return NextResponse.json({ exists: Boolean(existing) });
  } catch (error) {
    console.error('[POST /api/public/check-email]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ exists: false, error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ exists: false, error: 'Failed to check email' }, { status: 500 });
  }
}
