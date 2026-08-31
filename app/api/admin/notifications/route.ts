import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreateNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  icon: z.string().default('Bell'),
  target: z.string().default('All Members'),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const notifications = await withRetry(() =>
      prisma.broadcastNotification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    );
    return NextResponse.json({ data: notifications });
  } catch (error) {
    console.error('[GET /api/admin/notifications]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const body = await request.json();
    const parsed = CreateNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const notification = await withRetry(() =>
      prisma.broadcastNotification.create({ data: parsed.data }),
    );

    await logActivity({
      entity: 'notification',
      entityId: notification.id,
      action: 'send',
      description: `Broadcast notification "${notification.title}" to ${notification.target}`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/notifications]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
