import type { Metadata } from 'next';
import { getOrgConfig } from '@/lib/org-config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://compassionglobal.org';
const DEFAULT_OG_IMAGE = '/og-default.png';

export interface PageSEO {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
}

export async function generatePageMetadata(seo: PageSEO): Promise<Metadata> {
  const config = await getOrgConfig();
  const fullTitle = `${seo.title} | ${config.siteName}`;
  const ogImage = seo.ogImage || DEFAULT_OG_IMAGE;
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`;

  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: fullTitle,
      description: seo.description,
      url: `${SITE_URL}${seo.path}`,
      siteName: config.siteName,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: seo.title,
        },
      ],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: seo.description,
      images: [ogImageUrl],
    },
  };
}
