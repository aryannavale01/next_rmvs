import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { sendBatchEmails, buildNewsletterBroadcastHtml } from '@/lib/email';
import { logActivity } from '@/lib/activity-log';
import { checkRateLimit } from '@/lib/rate-limit';
import { buildUnsubscribeToken } from '@/lib/unsubscribe-token';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  const rateLimit = checkRateLimit(_request, 'admin_send_newsletter', 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const { id } = await params;

    // Fetch the newsletter
    const newsletter = await withRetry(() =>
      prisma.newsletter.findUnique({ where: { id } }),
    );
    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    if (newsletter.sentAt) {
      return NextResponse.json(
        { error: 'This newsletter has already been sent.' },
        { status: 400 },
      );
    }

    // Fetch all active subscribers (exclude unsubscribed)
    const subscribers = await withRetry(() =>
      prisma.newsletterSubscriber.findMany({
        where: { unsubscribed: false },
      }),
    );

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No active subscribers to send to.' },
        { status: 400 },
      );
    }

    // Build email HTML for each subscriber (with unique unsubscribe link)
    const emails = await Promise.all(
      subscribers.map(async (sub) => {
        const html = await buildNewsletterBroadcastHtml({
          title: newsletter.title,
          body: newsletter.body || '<p>No content provided.</p>',
          unsubscribeUrl: `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(sub.email)}&token=${encodeURIComponent(buildUnsubscribeToken(sub.email))}`,
        });
        return {
          to: sub.email,
          subject: newsletter.title,
          html,
        };
      }),
    );

    // Send batch via Resend
    const result = await sendBatchEmails(emails);

    // If every delivery failed, do not mark the newsletter as sent — otherwise the
    // "already been sent" guard would permanently block a legitimate retry.
    if (result.sent === 0 && result.failed > 0) {
      return NextResponse.json(
        {
          error: 'No emails could be delivered. The newsletter was not marked as sent — please check the email configuration and retry.',
          sent: 0,
          failed: result.failed,
          total: subscribers.length,
        },
        { status: 502 },
      );
    }

    // Update newsletter record
    await withRetry(() =>
      prisma.newsletter.update({
        where: { id },
        data: {
          sentAt: new Date(),
          sentCount: result.sent,
        },
      }),
    );

    await logActivity({
      entity: 'newsletter',
      entityId: id,
      action: 'send',
      description: `Sent newsletter "${newsletter.title}" to ${result.sent}/${subscribers.length} subscribers`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      total: subscribers.length,
    });
  } catch (error) {
    console.error('[POST /api/admin/newsletters/[id]/send]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 });
  }
}
