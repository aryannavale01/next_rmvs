import { NextRequest, NextResponse } from 'next/server';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe-token';

export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().email(),
});

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    const token = request.nextUrl.searchParams.get('token');
    if (!email) {
      return NextResponse.redirect(new URL('/unsubscribe?error=missing_email', request.url));
    }

    const rateLimit = checkRateLimit(request, 'unsubscribe', 10, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.redirect(new URL('/unsubscribe?error=rate_limited', request.url));
    }

    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      return NextResponse.redirect(new URL('/unsubscribe?error=invalid_email', request.url));
    }

    // Only process when the request carries a valid HMAC token for this email.
    // Without it, anyone who knows/guesses an email could revoke someone's
    // newsletter subscription.
    if (!verifyUnsubscribeToken(parsed.data.email, token)) {
      const subscriber = await withRetry(() =>
        prisma.newsletterSubscriber.findUnique({ where: { email: parsed.data.email } }),
      );
      if (!subscriber) {
        return NextResponse.redirect(new URL('/unsubscribe?error=not_found', request.url));
      }
      return NextResponse.redirect(new URL('/unsubscribe?error=invalid_token', request.url));
    }

    const subscriber = await withRetry(() =>
      prisma.newsletterSubscriber.findUnique({ where: { email: parsed.data.email } }),
    );

    if (!subscriber) {
      return NextResponse.redirect(new URL('/unsubscribe?error=not_found', request.url));
    }

    if (subscriber.unsubscribed) {
      return NextResponse.redirect(new URL('/unsubscribe?already=true', request.url));
    }

    await withRetry(() =>
      prisma.newsletterSubscriber.update({
        where: { email },
        data: { unsubscribed: true, unsubscribedAt: new Date() },
      }),
    );

    return NextResponse.redirect(new URL('/unsubscribe?success=true', request.url));
  } catch (error) {
    console.error('[GET /api/unsubscribe]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.redirect(new URL('/unsubscribe?error=database', request.url));
    }
    return NextResponse.redirect(new URL('/unsubscribe?error=unknown', request.url));
  }
}
