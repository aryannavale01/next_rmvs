import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { getRecentActivity } from '@/lib/activity-log';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const logs = await getRecentActivity(100);
  return NextResponse.json({ logs });
}
