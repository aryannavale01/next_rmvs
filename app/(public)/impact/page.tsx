import { prisma, withRetry } from '@/lib/prisma';
import { generatePageMetadata } from '@/lib/seo';
import ImpactClient from './impact-client';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: 'Our Impact',
    description: 'See the real impact of CompassionGlobal\'s work through photos, videos, and stories from communities we serve across India.',
    path: '/impact',
  });
}

export default async function ImpactPage() {
  const [rawGalleryItems, rawPartners] = await Promise.all([
    withRetry(() =>
      prisma.galleryItem.findMany({ where: { status: { not: 'deleted' } }, orderBy: { createdAt: 'desc' } })
    ),
    withRetry(() =>
      prisma.partner.findMany({ where: { status: { not: 'deleted' } }, orderBy: { name: 'asc' } })
    ),
  ]);

  const galleryItems = rawGalleryItems.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    image: item.image ?? '',
    description: item.description ?? '',
    location: item.location ?? '',
    loggedDate: item.loggedDate ? item.loggedDate.toISOString().split('T')[0] : '',
    isVideo: item.isVideo,
  }));

  const partners = rawPartners.map((p) => ({
    name: p.name,
    icon: p.icon,
  }));

  return <ImpactClient galleryItems={galleryItems} partners={partners} />;
}
