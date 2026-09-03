import { prisma, withRetry } from '@/lib/prisma';
import { generateSignedUrl } from '@/lib/supabase-storage';
import { generatePageMetadata } from '@/lib/seo';
import AboutClient from './about-client';
import type { ComplianceDoc, MilestoneData, LeaderData, LocationData } from './about-client';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: 'About Us | Rupashree Mahila Vikas Sanstha (RMVS), Junnar',
    description: 'Learn about RMVS\'s founding story, our governing committee, government registrations, and 1,520+ women trained across Junnar Taluka since 2014.',
    path: '/about',
  });
}

const ORG_DOCS_BUCKET = 'org-documents';
const SIGNED_URL_EXPIRY = 2592000;

const TYPE_LABELS: Record<string, string> = {
  NGO_REGISTRATION_CERTIFICATE: 'NGO Registration Certificate',
  PAN_CARD: 'PAN Card',
  TAN_CARD: 'TAN Card',
  NITI_AAYOG_REGISTRATION: 'NITI Aayog Registration',
  CSR1: 'CSR1 Certificate',
  ANNUAL_REPORT: 'Annual Reports',
  WORK_ORDER: 'Work Orders',
  ORG_PROFILE: 'Organisation Profile',
  CERTIFICATE_12A: '12A Registration',
  CERTIFICATE_80G: '80G Certificate',
};

export default async function AboutPage() {
  const [docs, dbMilestones, dbLeaders, dbLocations, settings] = await withRetry(() =>
    Promise.all([
      prisma.orgDocument.findMany({
        where: { isPublic: true, isActive: true },
        orderBy: [{ type: 'asc' }, { displayOrder: 'asc' }],
        select: {
          id: true, type: true, title: true, description: true,
          storagePath: true, mimeType: true, fileSize: true, year: true, displayOrder: true,
        },
      }),
      prisma.milestone.findMany({ where: { status: { not: 'deleted' } }, orderBy: { year: 'asc' } }),
      prisma.leader.findMany({ where: { status: { not: 'deleted' } }, orderBy: { name: 'asc' } }),
      prisma.location.findMany({ where: { status: { not: 'deleted' } }, orderBy: { name: 'asc' } }),
      prisma.siteSetting.findMany({ where: { category: { in: ['about', 'legal'] } } }),
    ]),
  );

  const s: Record<string, string> = {};
  settings.forEach(setting => { s[setting.key] = setting.value; });

  const complianceDocs: ComplianceDoc[] = await Promise.all(
    docs.map(async (doc) => {
      let fileUrl: string | null = null;
      if (doc.storagePath) {
        try {
          fileUrl = await generateSignedUrl(ORG_DOCS_BUCKET, doc.storagePath, SIGNED_URL_EXPIRY);
        } catch {
          console.error('[AboutPage] Failed to generate signed URL for:', doc.id);
        }
      }
      return {
        id: doc.id, type: doc.type, typeLabel: TYPE_LABELS[doc.type] || doc.type,
        title: doc.title, description: doc.description, fileUrl,
        mimeType: doc.mimeType, fileSize: doc.fileSize, year: doc.year, displayOrder: doc.displayOrder,
      };
    }),
  );

  const milestones: MilestoneData[] = dbMilestones.map(m => ({
    id: m.id, year: m.year, title: m.title, description: m.description ?? '',
  }));

  const leaders: LeaderData[] = dbLeaders.map(l => ({
    id: l.id, name: l.name, role: l.role, image: l.image ?? '', department: l.department ?? '', bio: l.bio ?? '', quote: l.quote ?? '',
  }));

  const locations: LocationData[] = dbLocations.map(l => ({
    id: l.id, name: l.name, location: l.location ?? '', coordinator: l.coordinator ?? '',
    staffCount: l.staffCount ?? 0, activePrograms: l.activePrograms ?? [],
    contactEmail: l.contactEmail ?? '', coordinates: l.coordinates ?? '', description: l.description ?? '',
  }));

  return <AboutClient complianceDocs={complianceDocs} milestones={milestones} leaders={leaders} locations={locations} settings={s} />;
}
