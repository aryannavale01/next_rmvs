import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(new Headers(req.headers));
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const userId = auth.session.user.id;

    if (body.ids && body.all) {
      return NextResponse.json({ error: 'Cannot provide both "ids" and "all"' }, { status: 400 });
    }

    if (!body.ids && !body.all) {
      return NextResponse.json({ error: 'Provide either "ids" or "all": true' }, { status: 400 });
    }

    let updated;

    if (body.all === true) {
      updated = await prisma.notification.updateMany({
        where: { profileId: userId, read: false },
        data: { read: true },
      });
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      updated = await prisma.notification.updateMany({
        where: { id: { in: body.ids }, profileId: userId },
        data: { read: true },
      });
    } else {
      return NextResponse.json({ error: '"ids" must be a non-empty array' }, { status: 400 });
    }

    return NextResponse.json({ success: true, updated: updated.count });
  } catch {
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
  }
}
