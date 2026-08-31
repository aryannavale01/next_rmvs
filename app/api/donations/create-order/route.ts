import { NextRequest, NextResponse } from 'next/server';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const Razorpay = (await import('razorpay')).default;

let razorpay: InstanceType<typeof Razorpay> | null = null;
function getRazorpayClient() {
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials are not configured');
    }
    razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return razorpay;
}

const schema = z.object({
  amount: z.number().int().min(10).max(100000),
  donorName: z.string().min(1).max(200),
  donorEmail: z.string().email(),
  donorPhone: z.string().optional(),
  frequency: z.enum(['one-time', 'monthly']).default('one-time'),
  message: z.string().max(1000).optional(),
});

function generateReceiptId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `CG-DON-${date}-${rand}`;
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'donation_create_order', 10, 15 * 60 * 1000);
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

    const { amount, donorName, donorEmail, donorPhone, frequency, message } = parsed.data;

    const receiptId = generateReceiptId();

    let order;
    try {
      order = await getRazorpayClient().orders.create({
        amount: amount * 100,
        currency: 'INR',
        receipt: receiptId,
        notes: { donorName, donorEmail, frequency },
      });
    } catch (configError: any) {
      if (configError?.message === 'Razorpay credentials are not configured') {
        console.error('[POST /api/donations/create-order]', configError.message);
        return NextResponse.json({ error: 'Payment processing is not available right now. Please try again later.' }, { status: 503 });
      }
      throw configError;
    }

    await withRetry(() =>
      prisma.donation.create({
        data: {
          donorName,
          donorEmail,
          donorPhone: donorPhone || undefined,
          amount,
          currency: 'INR',
          frequency,
          receiptId,
          status: 'pending',
          razorpayOrderId: order.id,
          message: message || undefined,
        },
      }),
    );

    return NextResponse.json({
      orderId: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      donorName,
      donorEmail,
      receiptId,
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/donations/create-order]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to create donation order' }, { status: 500 });
  }
}
