import { NextRequest, NextResponse } from 'next/server';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const VolunteerInquirySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
  hoursPerWeek: z.string().min(1, 'Hours per week is required'),
  motivation: z.string().min(10, 'Please provide a brief statement (min 10 characters)'),
});

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'public_volunteer', 3, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  try {
    const body = await request.json();
    const parsed = VolunteerInquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const inquiry = await withRetry(() =>
      prisma.volunteerInquiry.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          role: parsed.data.role,
          hoursPerWeek: parsed.data.hoursPerWeek,
          motivation: parsed.data.motivation,
        },
      }),
    );

    return NextResponse.json({
      success: true,
      message: 'Your volunteer application has been submitted successfully.',
      id: inquiry.id,
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/public/volunteer-inquiries]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to submit volunteer inquiry' }, { status: 500 });
  }
}
