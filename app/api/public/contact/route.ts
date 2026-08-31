import { NextRequest, NextResponse } from 'next/server';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendContactConfirmationEmail } from '@/lib/email';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().max(500).optional().default(''),
  message: z.string().min(10).max(5000),
  turnstileToken: z.string().optional(),
});

async function verifyTurnstile(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return true;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'public_contact', 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  try {
    const body = await request.json();
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    if (process.env.TURNSTILE_SECRET_KEY && parsed.data.turnstileToken) {
      const valid = await verifyTurnstile(parsed.data.turnstileToken);
      if (!valid) {
        return NextResponse.json({ error: 'Captcha verification failed. Please try again.' }, { status: 400 });
      }
    }

    await withRetry(() =>
      prisma.broadcastNotification.create({
        data: {
          title: `Contact: ${parsed.data.subject || 'General Inquiry'}`,
          description: `From: ${parsed.data.name} (${parsed.data.email})\n\n${parsed.data.message}`,
          icon: 'Mail',
          target: 'Admin',
        },
      }),
    );

    // Fire-and-forget: send confirmation email to submitter
    sendContactConfirmationEmail({
      submitterName: parsed.data.name,
      submitterEmail: parsed.data.email,
      subject: parsed.data.subject,
    }).catch((e) => console.error('[contact] Failed to send confirmation email:', e));

    return NextResponse.json({ success: true, message: 'Your message has been received. We will respond within 24 hours.' }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/public/contact]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
