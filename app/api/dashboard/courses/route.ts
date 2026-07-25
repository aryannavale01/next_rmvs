import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const CATEGORY_DISPLAY: Record<string, string> = {
  tech: 'Technology',
  health: 'Health',
  leadership: 'Leadership',
  environment: 'Environment',
};

const LEVEL_DISPLAY: Record<string, 'Beginner' | 'Intermediate' | 'Advanced'> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const MODE_DISPLAY: Record<string, 'Online' | 'Offline' | 'Hybrid'> = {
  online: 'Online',
  offline: 'Offline',
  hybrid: 'Hybrid',
};

const LESSON_TYPE_MAP: Record<string, 'video' | 'quiz' | 'document' | 'practical'> = {
  video: 'video',
  quiz: 'quiz',
  text: 'document',
  document: 'document',
  practical: 'practical',
};

export async function GET(request: Request) {
  const auth = await requireAuth(new Headers(request.headers));
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rawCourses = await prisma.course.findMany({
      where: { status: 'active' },
      include: {
        syllabus: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const courses = rawCourses.map((c) => ({
      id: c.id,
      title: c.title,
      category: CATEGORY_DISPLAY[c.category] ?? c.category,
      level: LEVEL_DISPLAY[c.level] ?? 'Beginner',
      duration: c.duration,
      mode: MODE_DISPLAY[c.mode] ?? 'Online',
      location: c.location ?? '',
      startDate: c.startDate ? c.startDate.toISOString().split('T')[0] : '',
      endDate: c.endDate ? c.endDate.toISOString().split('T')[0] : '',
      seatsLeft: c.seatsAvailable ?? 0,
      totalSeats: c.seatsTotal ?? 0,
      price: c.price != null ? Number(c.price) : 0,
      syllabus: c.syllabus.map((s) => ({
        title: s.title,
        duration: s.durationMinutes ? `${Math.ceil(s.durationMinutes / 60)} Hours` : '',
        type: LESSON_TYPE_MAP[s.lessonType] ?? 'document',
        isFreePreview: s.isFreePreview,
      })),
      instructor: {
        name: c.instructorName,
        designation: c.instructorRole ?? '',
        rating: 4.5,
        photo: c.instructorImage ?? '',
      },
      description: c.description,
      longDescription: c.description,
    }));

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('[courses] GET error:', error);
    return NextResponse.json({ error: 'Failed to load courses' }, { status: 500 });
  }
}
