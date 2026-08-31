import { requireAdmin } from '@/lib/session';
import { prisma, withRetry } from '@/lib/prisma';
import NewslettersClient from './newsletters-client';

export const dynamic = 'force-dynamic';

export default async function AdminNewslettersPage() {
  const auth = await requireAdmin();
  if (!auth.success) return null;

  const [newsletters, subscriberCount] = await withRetry(() =>
    Promise.all([
      prisma.newsletter.findMany({
        where: { status: { not: 'deleted' } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.newsletterSubscriber.count({ where: { unsubscribed: false } }),
    ]),
  );

  const mapped = newsletters.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body || '',
    date: n.date?.toISOString() || null,
    readTime: n.readTime || null,
    sentAt: n.sentAt?.toISOString() || null,
    sentCount: n.sentCount || null,
    createdAt: n.createdAt.toISOString(),
  }));

  return <NewslettersClient newsletters={mapped} subscriberCount={subscriberCount} />;
}
