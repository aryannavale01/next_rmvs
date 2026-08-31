import { prisma, withRetry } from '@/lib/prisma';
import { generatePageMetadata } from '@/lib/seo';
import ResourcesClient from './resources-client';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: 'Resources',
    description: 'Read the latest blog posts, newsletters, and updates from CompassionGlobal. Stay informed about our programs and community impact.',
    path: '/resources',
  });
}

export default async function ResourcesPage() {
  const [rawBlogs, rawNewsletters] = await Promise.all([
    withRetry(() =>
      prisma.blogPost.findMany({ where: { status: { not: 'deleted' } }, orderBy: { date: 'desc' } })
    ),
    withRetry(() =>
      prisma.newsletter.findMany({ where: { status: { not: 'deleted' } }, orderBy: { date: 'desc' } })
    ),
  ]);

  const blogPosts = rawBlogs.map((b) => ({
    id: b.id,
    title: b.title,
    category: b.category ?? '',
    description: b.description ?? '',
    content: b.content ?? '',
    readTime: b.readTime ?? '',
    date: b.date ? b.date.toISOString().split('T')[0] : '',
    image: b.image ?? '',
    author: b.author,
  }));

  const newsletters = rawNewsletters.map((nl) => ({
    id: nl.id,
    title: nl.title,
    date: nl.date ? nl.date.toISOString().split('T')[0] : '',
    readTime: nl.readTime ?? '',
    image: nl.image ?? '',
  }));

  return <ResourcesClient blogPosts={blogPosts} newsletters={newsletters} />;
}
