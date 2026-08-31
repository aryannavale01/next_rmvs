import { requireAdmin } from '@/lib/session';
import { getRecentActivity } from '@/lib/activity-log';
import ActivityLogsClient from './activity-logs-client';

export const dynamic = 'force-dynamic';

export default async function AdminActivityLogsPage() {
  const auth = await requireAdmin();
  if (!auth.success) return null;

  const logs = await getRecentActivity(100);

  return <ActivityLogsClient logs={logs} />;
}
