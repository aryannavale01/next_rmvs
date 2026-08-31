import { NextRequest, NextResponse } from 'next/server';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendEnrollmentConfirmationEmail } from '@/lib/email';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const EnrollSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  courseId: z.string().min(1),
  courseTitle: z.string().min(1),
  motivation: z.string().optional().default(''),
});

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'public_enroll', 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  try {
    const body = await request.json();
    const parsed = EnrollSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    await withRetry(() =>
      prisma.broadcastNotification.create({
        data: {
          title: `Enrollment: ${parsed.data.courseTitle}`,
          description: `Student: ${parsed.data.name} (${parsed.data.email})\nCourse ID: ${parsed.data.courseId}\n\nMotivation: ${parsed.data.motivation || 'Not provided'}`,
          icon: 'BookOpen',
          target: 'Admin',
        },
      }),
    );

    // Fire-and-forget: send enrollment confirmation email
    sendEnrollmentConfirmationEmail({
      applicantName: parsed.data.name,
      applicantEmail: parsed.data.email,
      courseTitle: parsed.data.courseTitle,
    }).catch((e) => console.error('[enroll] Failed to send confirmation email:', e));

    return NextResponse.json({ success: true, message: 'Enrollment request received. We will contact you shortly.' }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/public/enroll]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to submit enrollment' }, { status: 500 });
  }
}
