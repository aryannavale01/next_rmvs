import { prisma, withRetry } from '@/lib/prisma';
import { generatePageMetadata } from '@/lib/seo';
import ContactClient from './contact-client';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: 'Contact Us | Rupashree Mahila Vikas Sanstha',
    description: 'Get in touch with Rupashree Mahila Vikas Sanstha (RMVS) in Junnar, Pune district — for training enrolment, volunteering, partnerships, or general queries.',
    path: '/contact',
  });
}

export default async function ContactPage() {
  const [settings, locations] = await withRetry(() =>
    Promise.all([
      prisma.siteSetting.findMany({ orderBy: { key: 'asc' } }),
      prisma.location.findMany({ where: { status: { not: 'deleted' } }, orderBy: { name: 'asc' } }),
    ]),
  );

  const settingsMap: Record<string, string> = {};
  settings.forEach(s => { settingsMap[s.key] = s.value; });

  const offices = locations.map(l => ({
    id: l.id,
    name: l.name,
    location: l.location ?? '',
    address: l.address ?? '',
    contactEmail: l.contactEmail ?? '',
    phone: l.phone ?? '',
    description: l.description ?? '',
  }));

  return (
    <ContactClient
      phone={settingsMap.contact_phone || ''}
      email={settingsMap.contact_email || ''}
      address={settingsMap.contact_address || ''}
      officeHours={settingsMap.office_hours || ''}
      facebook={settingsMap.social_facebook || ''}
      instagram={settingsMap.social_instagram || ''}
      youtube={settingsMap.social_youtube || ''}
      offices={offices}
    />
  );
}
