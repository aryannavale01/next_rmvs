import { generatePageMetadata } from '@/lib/seo';
import DonateClient from './donate-client';
import { prisma, withRetry } from '@/lib/prisma';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: 'Donate | Support Rupashree Mahila Vikas Sanstha',
    description: 'Support women\'s skill development and livelihood training in Junnar Taluka, Pune. Your contribution helps RMVS train more women and girls.',
    path: '/donate',
  });
}

export default async function DonatePage() {
  const taxSetting = await withRetry(() =>
    prisma.siteSetting.findUnique({ where: { key: 'donate_tax_note' } }),
  );
  return <DonateClient taxNote={taxSetting?.value || undefined} />;
}
