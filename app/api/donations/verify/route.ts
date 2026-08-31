import { NextRequest, NextResponse } from 'next/server';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { sendDonationPledgeEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const schema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'donation_verify', 10, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const sigBuf = Buffer.from(razorpay_signature, 'utf8');
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const donation = await withRetry(() =>
      prisma.donation.findFirst({ where: { razorpayOrderId: razorpay_order_id } }),
    );

    if (!donation) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
    }

    if (donation.status === 'paid') {
      return NextResponse.json({ success: true, receiptId: donation.receiptId });
    }

    await withRetry(() =>
      prisma.donation.update({
        where: { id: donation.id },
        data: {
          status: 'paid',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paidAt: new Date(),
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

    return NextResponse.json({ success: true, receiptId: donation.receiptId });
  } catch (error) {
    console.error('[POST /api/donations/verify]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
