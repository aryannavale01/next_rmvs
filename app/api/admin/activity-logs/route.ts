import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { getRecentActivity } from '@/lib/activity-log';
import { withRetry, isTransientPrismaError } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const logs = await withRetry(() => getRecentActivity(100));
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('[GET /api/admin/activity-logs]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json(
        { error: 'Database temporarily unavailable, please retry.' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}
