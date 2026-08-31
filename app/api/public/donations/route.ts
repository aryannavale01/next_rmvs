import { NextRequest, NextResponse } from 'next/server';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendDonationPledgeEmail } from '@/lib/email';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const DonationSchema = z.object({
  donorName: z.string().min(1, 'Name is required').max(200),
  donorEmail: z.string().email('Invalid email address'),
  amount: z.number().min(1, 'Donation amount must be at least $1'),
  currency: z.string().default('USD'),
  frequency: z.enum(['one-time', 'monthly']).default('one-time'),
  message: z.string().max(2000).optional().default(''),
});

function generateReceiptId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `CG-PLEDGE-${y}${m}${d}-${rand}`;
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'public_donation', 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  try {
    const body = await request.json();
    const parsed = DonationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const receiptId = generateReceiptId();

    const donation = await withRetry(() =>
      prisma.donation.create({
        data: {
          donorName: parsed.data.donorName,
          donorEmail: parsed.data.donorEmail,
          amount: parsed.data.amount,
          currency: parsed.data.currency,
          frequency: parsed.data.frequency,
          receiptId,
          status: 'pending',
          message: parsed.data.message || null,
        },
      }),
    );

    // Fire-and-forget: send pledge confirmation email
    sendDonationPledgeEmail({
      donorName: parsed.data.donorName,
      donorEmail: parsed.data.donorEmail,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      frequency: parsed.data.frequency,
      pledgeId: receiptId,
    }).catch((e) => console.error('[donations] Failed to send pledge email:', e));

    return NextResponse.json({
      success: true,
      message: 'Donation pledge recorded. Our team will contact you to complete payment.',
      receiptId: donation.receiptId,
      id: donation.id,
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/public/donations]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to record donation' }, { status: 500 });
  }
}
