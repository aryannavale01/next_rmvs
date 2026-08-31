import { prisma, withRetry } from '@/lib/prisma';
import { generatePageMetadata } from '@/lib/seo';
import { requireAuth } from '@/lib/session';
import { CATEGORY_DISPLAY } from '@/lib/course-categories';
import { notFound } from 'next/navigation';
import ProgramDetailClient from './program-detail-client';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const LEVEL_DISPLAY: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const MODE_DISPLAY: Record<string, string> = {
  online: 'Online',
  offline: 'In-Person',
  hybrid: 'Hybrid',
};

type EnrollmentStatus = 'not_applied' | 'applied' | 'enrolled';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = await withRetry(() =>
    prisma.course.findUnique({ where: { slug }, select: { title: true, metaDescription: true, description: true } }),
  );
  if (!course) {
    return generatePageMetadata({ title: 'Program Not Found', description: 'The requested program could not be found.', path: `/programs/${slug}` });
  }
  return generatePageMetadata({
    title: course.title,
    description: course.metaDescription || course.description.slice(0, 160),
    path: `/programs/${slug}`,
  });
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const course = await withRetry(() =>
    prisma.course.findUnique({
      where: { slug },
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
            profilePhoto: true,
            designation: true,
            bio: true,
            rating: true,
            experienceYears: true,
            specializations: true,
          },
        },
        syllabus: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            lessonType: true,
            durationMinutes: true,
            isFreePreview: true,
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    }),
  );

  if (!course) notFound();

  const seatsTotal = course.seatsTotal ?? null;
  const seatsLeft: number | 'Unlimited' =
    seatsTotal != null ? Math.max(0, seatsTotal - course._count.enrollments) : 'Unlimited';

  let enrollmentStatus: EnrollmentStatus = 'not_applied';
  let applicationStatus: string | null = null;
  let isLoggedIn = false;

  const auth = await requireAuth();
  if (auth.success) {
    isLoggedIn = true;
    const userId = auth.session.user.id;

    const [application, enrollment] = await Promise.all([
      withRetry(() =>
        prisma.courseApplication.findUnique({
          where: { profileId_courseId: { profileId: userId, courseId: course.id } },
          select: { status: true },
        }),
      ),
      withRetry(() =>
        prisma.courseEnrollment.findUnique({
          where: { profileId_courseId: { profileId: userId, courseId: course.id } },
          select: { status: true },
        }),
      ),
    ]);

    if (enrollment) {
      enrollmentStatus = 'enrolled';
    } else if (application) {
      enrollmentStatus = 'applied';
      applicationStatus = application.status;
    }
  }

  return (
    <ProgramDetailClient
      course={{
        id: course.id,
        slug: course.slug,
        title: course.title,
        category: CATEGORY_DISPLAY[course.category as keyof typeof CATEGORY_DISPLAY] ?? course.category,
        level: LEVEL_DISPLAY[course.level] ?? course.level,
        mode: MODE_DISPLAY[course.mode] ?? course.mode,
        description: course.description,
        duration: course.duration,
        location: course.location,
        image: course.image,
        seatsTotal,
        seatsLeft,
        benefits: course.benefits,
        eligibility: course.eligibility,
        requiredDocuments: course.requiredDocuments,
        instructor: {
          name: course.instructorName,
          role: course.instructorRole ?? '',
          image: course.instructorImage ?? '',
          teacher: course.teacher
            ? {
                fullName: course.teacher.fullName,
                profilePhoto: course.teacher.profilePhoto,
                designation: course.teacher.designation,
                bio: course.teacher.bio,
                rating: course.teacher.rating ? Number(course.teacher.rating) : null,
                experienceYears: course.teacher.experienceYears,
                specializations: course.teacher.specializations,
              }
            : null,
        },
        syllabus: course.syllabus.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          lessonType: s.lessonType,
          durationMinutes: s.durationMinutes,
          isFreePreview: s.isFreePreview,
        })),
      }}
      enrollmentStatus={enrollmentStatus}
      applicationStatus={applicationStatus}
      isLoggedIn={isLoggedIn}
    />
  );
}
