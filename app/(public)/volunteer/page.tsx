import { prisma, withRetry } from '@/lib/prisma';
import { generatePageMetadata } from '@/lib/seo';
import VolunteerClient from './volunteer-client';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: 'Volunteer | Rupashree Mahila Vikas Sanstha',
    description: 'Volunteer with Rupashree Mahila Vikas Sanstha in Junnar Taluka, Pune. Help us deliver skill training, community outreach, and livelihood support for rural women.',
    path: '/volunteer',
  });
}

export default async function VolunteerPage() {
  const [locations, settings] = await withRetry(() =>
    Promise.all([
      prisma.location.findMany({ where: { status: { not: 'deleted' } }, orderBy: { name: 'asc' } }),
      prisma.siteSetting.findMany({ where: { category: 'volunteer' } }),
    ]),
  );

  const s: Record<string, string> = {};
  settings.forEach(setting => { s[setting.key] = setting.value; });

  const offices = locations.map(l => ({
    id: l.id,
    name: l.name,
    location: l.location ?? '',
    address: l.address ?? '',
    contactEmail: l.contactEmail ?? '',
    phone: l.phone ?? '',
    description: l.description ?? '',
  }));

  return <VolunteerClient offices={offices} heroImage={s.volunteer_hero_image || ''} />;
}
