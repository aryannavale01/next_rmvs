import { prisma } from '@/lib/prisma';
import { generatePageMetadata } from '@/lib/seo';
import ProgramsClient from './programs-client';
import type { PublicCourse, PublicProgram } from './programs-client';
import type { Metadata } from 'next';
import { CATEGORY_DISPLAY } from '@/lib/course-categories';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: 'Programs & Courses',
    description: 'Explore skill development courses in Technology, Health, Agriculture, and more. Join training programs designed to empower communities.',
    path: '/programs',
  });
}

const LEVEL_DISPLAY: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const PROGRAM_CATEGORY_DISPLAY: Record<string, string> = {
  health: 'Health',
  education: 'Education',
  environment: 'Environment',
  emergency_relief: 'Emergency Relief',
};

function mapCourseForPublic(c: {
  id: string;
  slug: string;
  title: string;
  category: string;
  level: string;
  description: string;
  duration: string;
  seatsTotal: number | null;
  instructorName: string;
  instructorRole: string | null;
  instructorImage: string | null;
  image: string | null;
  _count: { enrollments: number };
}): PublicCourse {
  const seatsTotal = c.seatsTotal ?? null;
  const seatsLeft: number | 'Unlimited' =
    seatsTotal != null ? Math.max(0, seatsTotal - c._count.enrollments) : 'Unlimited';

  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    category: CATEGORY_DISPLAY[c.category as keyof typeof CATEGORY_DISPLAY] ?? c.category,
    level: LEVEL_DISPLAY[c.level] ?? c.level,
    instructor: {
      name: c.instructorName,
      role: c.instructorRole ?? '',
      image: c.instructorImage ?? '',
    },
    duration: c.duration,
    seatsLeft,
    seatsTotal,
    image: c.image ?? '',
    description: c.description,
  };
}

export default async function ProgramsPage() {
  const [courses, strategicPrograms] = await Promise.all([
    prisma.course.findMany({
      where: {
        status: 'active',
        visibility: { in: ['programs', 'both'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        level: true,
        description: true,
        duration: true,
        seatsTotal: true,
        instructorName: true,
        instructorRole: true,
        instructorImage: true,
        image: true,
        _count: {
          select: { enrollments: true },
        },
      },
    }),
    prisma.program.findMany({
      where: {
        isStrategic: true,
        visibility: { in: ['both', 'programs'] },
        status: { not: 'deleted' },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const publicCourses = courses.map(mapCourseForPublic);
  const publicStrategicPrograms: PublicProgram[] = strategicPrograms.map(p => ({
    id: p.id,
    title: p.title,
    category: PROGRAM_CATEGORY_DISPLAY[p.category] ?? p.category,
    description: p.description,
    goal: Number(p.goal ?? 0),
    raised: Number(p.raised ?? 0),
    image: p.image ?? '',
  }));

  const featuredProgram = publicStrategicPrograms[0] ?? null;

  return <ProgramsClient courses={publicCourses} strategicPrograms={publicStrategicPrograms} featuredProgram={featuredProgram} />;
}
