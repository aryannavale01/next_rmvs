import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const CATEGORY_DISPLAY: Record<string, string> = {
  tech: 'Technology',
  health: 'Health',
  leadership: 'Leadership',
  environment: 'Environment',
  agriculture: 'Agriculture',
  skill_dev: 'Skill Dev',
  basic_digital: 'Basic Digital',
};

const LEVEL_DISPLAY: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const MODE_DISPLAY: Record<string, string> = {
  online: 'Online',
  offline: 'Offline',
  hybrid: 'Hybrid',
};

function differenceInDays(a: Date, b: Date): number {
  const msPerDay = 86_400_000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utcA - utcB) / msPerDay);
}

function parseDurationString(duration: string): number {
  const match = duration.match(/(\d+)\s*(week|day|month)/i);
  if (!match) return 28;
  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  if (unit === 'day') return num;
  if (unit === 'week') return num * 7;
  if (unit === 'month') return num * 30;
  return 28;
}

function computeProgress(
  courseStartDate: Date | null,
  courseEndDate: Date | null,
  duration: string,
  applicationStatus: string
): {
  displayStatus: 'pending' | 'under_review' | 'not_started' | 'in_progress' | 'completed';
  progress: { percentComplete: number; totalDays: number; daysElapsed: number; daysRemaining: number } | null;
} {
  const now = new Date();

  if (applicationStatus === 'pending' || applicationStatus === 'under_review') {
    return {
      displayStatus: applicationStatus === 'pending' ? 'pending' : 'under_review',
      progress: null,
    };
  }

  if (applicationStatus === 'completed') {
    return {
      displayStatus: 'completed',
      progress: { percentComplete: 100, totalDays: 0, daysElapsed: 0, daysRemaining: 0 },
    };
  }

  if (!courseStartDate) {
    return { displayStatus: 'not_started', progress: null };
  }

  const totalDays = (courseStartDate && courseEndDate)
    ? differenceInDays(courseEndDate, courseStartDate)
    : parseDurationString(duration);

  if (totalDays <= 0) {
    return { displayStatus: 'in_progress', progress: { percentComplete: 100, totalDays: 0, daysElapsed: 0, daysRemaining: 0 } };
  }

  if (now < courseStartDate) {
    return { displayStatus: 'not_started', progress: null };
  }

  const daysElapsed = differenceInDays(now, courseStartDate);
  const endDate = courseEndDate ?? new Date(courseStartDate.getTime() + totalDays * 86_400_000);

  if (now >= endDate) {
    return {
      displayStatus: 'completed',
      progress: { percentComplete: 100, totalDays, daysElapsed: totalDays, daysRemaining: 0 },
    };
  }

  const percentComplete = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
  return {
    displayStatus: 'in_progress',
    progress: {
      percentComplete,
      totalDays,
      daysElapsed,
      daysRemaining: totalDays - daysElapsed,
    },
  };
}

export async function GET(request: Request) {
  const auth = await requireAuth(new Headers(request.headers));
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = auth.session.user.id;

  try {
    const [rawApplications, rawCertificates] = await Promise.all([
      prisma.courseApplication.findMany({
        where: { profileId: userId, status: { not: 'rejected' } },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              category: true,
              level: true,
              duration: true,
              mode: true,
              startDate: true,
              endDate: true,
            },
          },
        },
        orderBy: { appliedDate: 'desc' },
      }),
      prisma.certificate.findMany({
        where: { profileId: userId },
        select: { id: true, courseId: true },
      }),
    ]);

    const certificateMap = new Map<string, string>();
    for (const cert of rawCertificates) {
      if (cert.courseId) certificateMap.set(cert.courseId, cert.id);
    }

    const myCourses = rawApplications.map((app) => {
      const course = app.course;
      if (!course) {
        return {
          applicationId: app.id,
          courseId: app.courseId,
          title: 'Deleted Course',
          category: '',
          level: '',
          duration: '',
          mode: '',
          startDate: null,
          endDate: null,
          appliedDate: app.appliedDate.toISOString().split('T')[0],
          displayStatus: 'pending' as const,
          progress: null,
          hasCertificate: false,
          certificateId: null,
        };
      }

      const { displayStatus, progress } = computeProgress(
        course.startDate,
        course.endDate,
        course.duration,
        app.status
      );

      const certId = certificateMap.get(course.id) ?? null;

      return {
        applicationId: app.id,
        courseId: course.id,
        title: course.title,
        category: CATEGORY_DISPLAY[course.category] ?? course.category,
        level: LEVEL_DISPLAY[course.level] ?? course.level,
        duration: course.duration,
        mode: MODE_DISPLAY[course.mode] ?? course.mode,
        startDate: course.startDate ? course.startDate.toISOString().split('T')[0] : null,
        endDate: course.endDate ? course.endDate.toISOString().split('T')[0] : null,
        appliedDate: app.appliedDate.toISOString().split('T')[0],
        displayStatus,
        progress,
        hasCertificate: certId !== null,
        certificateId: certId,
      };
    });

    return NextResponse.json({ myCourses });
  } catch (error) {
    console.error('[my-courses] GET error:', error);
    return NextResponse.json({ error: 'Failed to load my courses' }, { status: 500 });
  }
}
