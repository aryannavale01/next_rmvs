import { NextRequest, NextResponse } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
import { sendDonationPledgeEmail } from '@/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
    }
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      console.error('[Razorpay Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    switch (event.event) {
      case 'payment.captured': {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;
        const paymentId = payment.id;

        const donation = await withRetry(() =>
          prisma.donation.findFirst({ where: { razorpayOrderId: orderId } }),
        );

        if (donation && donation.status !== 'paid') {
          await withRetry(() =>
            prisma.donation.update({
              where: { id: donation.id },
              data: {
                status: 'paid',
                razorpayPaymentId: paymentId,
                paymentMethod: payment.method || null,
                paidAt: new Date(payment.created_at * 1000),
              },
            }),
          );

          sendDonationPledgeEmail({
            donorName: donation.donorName,
            donorEmail: donation.donorEmail,
            amount: donation.amount,
            currency: donation.currency,
            frequency: donation.frequency,
            pledgeId: donation.receiptId || '',
          }).catch(console.error);
        }
        break;
      }

      case 'payment.failed': {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;

        const donation = await withRetry(() =>
          prisma.donation.findFirst({ where: { razorpayOrderId: orderId } }),
        );

        if (donation) {
          await withRetry(() =>
            prisma.donation.update({
              where: { id: donation.id },
              data: {
                status: 'failed',
                failureReason: payment.error_description || 'Payment failed',
              },
            }),
          );
        }
        break;
      }

      case 'payment.authorized': {
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[POST /api/webhooks/razorpay]', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
