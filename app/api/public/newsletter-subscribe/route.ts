import { NextRequest, NextResponse } from 'next/server';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendNewsletterWelcomeEmail } from '@/lib/email';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const SubscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  source: z.string().default('footer'),
});

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'public_newsletter', 10, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  try {
    const body = await request.json();
    const parsed = SubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const existing = await withRetry(() =>
      prisma.newsletterSubscriber.findUnique({ where: { email: parsed.data.email } }),
    );

    if (existing) {
      return NextResponse.json({ success: true, message: 'You are already subscribed.' }, { status: 200 });
    }

    await withRetry(() =>
      prisma.newsletterSubscriber.create({
        data: { email: parsed.data.email, source: parsed.data.source },
      }),
    );

    // Fire-and-forget: send welcome email
    sendNewsletterWelcomeEmail({ subscriberEmail: parsed.data.email })
      .catch((e) => console.error('[newsletter] Failed to send welcome email:', e));

    return NextResponse.json({ success: true, message: 'Subscribed successfully!' }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/public/newsletter-subscribe]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
