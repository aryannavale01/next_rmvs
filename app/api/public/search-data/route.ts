import { NextResponse } from 'next/server';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [courses, programs, leaders] = await withRetry(() =>
      Promise.all([
        prisma.course.findMany({
          where: { status: 'active', visibility: { in: ['programs', 'both'] } },
          select: { id: true, title: true, category: true, description: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        prisma.program.findMany({
          where: { visibility: { in: ['both', 'programs'] }, status: { not: 'deleted' } },
          select: { id: true, title: true, category: true, description: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        prisma.leader.findMany({
          where: { status: { not: 'deleted' } },
          select: { id: true, name: true, role: true },
          orderBy: { name: 'asc' },
          take: 20,
        }),
      ]),
    );

    return NextResponse.json({ courses, programs, leaders });
  } catch (error) {
    console.error('[GET /api/public/search-data]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable' }, { status: 503 });
    }
    return NextResponse.json({ courses: [], programs: [], leaders: [] });
  }
}
