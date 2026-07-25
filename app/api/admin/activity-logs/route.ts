import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { getRecentActivity } from '@/lib/activity-log';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const logs = await getRecentActivity(100);
    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}
