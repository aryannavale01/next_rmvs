import { prisma, withRetry } from '@/lib/prisma';
import { generatePageMetadata } from '@/lib/seo';
import MissionPageClient from './page-client';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: 'Home',
    description: 'CompassionGlobal empowers local communities through skill development training, education programs, and sustainable development initiatives across India.',
    path: '/',
  });
}

export default async function MissionPage() {
  const [milestones, leaders, programs, partners, testimonials, settings] = await withRetry(() =>
    Promise.all([
      prisma.milestone.findMany({ where: { status: { not: 'deleted' } }, orderBy: { year: 'asc' } }),
      prisma.leader.findMany({ where: { status: { not: 'deleted' } }, orderBy: { name: 'asc' } }),
      prisma.program.findMany({ where: { visibility: { in: ['both', 'homepage'] }, status: { not: 'deleted' } }, orderBy: { createdAt: 'desc' } }),
      prisma.partner.findMany({ where: { status: { not: 'deleted' } }, orderBy: { name: 'asc' } }),
      prisma.testimonial.findMany({ where: { status: { not: 'deleted' } }, orderBy: { createdAt: 'desc' }, take: 3 }),
      prisma.siteSetting.findMany({ where: { category: 'homepage' } }),
    ]),
  );

  const s: Record<string, string> = {};
  settings.forEach(setting => { s[setting.key] = setting.value; });

  return (
    <MissionPageClient
      milestones={milestones.map(m => ({ id: m.id, year: m.year, title: m.title, description: m.description ?? '' }))}
      leaders={leaders.map(l => ({ id: l.id, name: l.name, role: l.role, image: l.image ?? '', department: l.department ?? '', bio: l.bio ?? '' }))}
      programs={programs.map(p => ({ id: p.id, title: p.title, category: p.category, description: p.description, goal: Number(p.goal ?? 0), raised: Number(p.raised ?? 0), image: p.image ?? '' }))}
      partners={partners.map(p => ({ id: p.id, name: p.name, icon: p.icon }))}
      testimonials={testimonials.map(t => ({ id: t.id, name: t.name, role: t.role ?? '', quote: t.quote, rating: t.rating, initials: t.initials ?? '', avatarUrl: t.avatarUrl ?? '' }))}
      settings={s}
    />
  );
}
