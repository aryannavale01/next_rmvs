import { requireAdmin } from '@/lib/session';
import { prisma, withRetry } from '@/lib/prisma';
import NotificationsClient from './notifications-client';

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  const auth = await requireAdmin();
  if (!auth.success) return null;

  const notifications = await withRetry(() =>
    prisma.broadcastNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  );

  const mapped = notifications.map(n => ({
    id: n.id,
    title: n.title,
    description: n.description,
    icon: n.icon,
    target: n.target,
    created_at: n.createdAt.toISOString().replace('T', ' ').slice(0, 16),
  }));

  return <NotificationsClient notifications={mapped} />;
}
