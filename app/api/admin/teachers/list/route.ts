import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const teachers = await withRetry(() =>
      prisma.teacher.findMany({
        where: { status: { not: 'deleted' } },
        orderBy: { fullName: 'asc' },
        select: { id: true, fullName: true, designation: true, profilePhoto: true, specializations: true },
      }),
    );
    return NextResponse.json({ data: teachers });
  } catch (error) {
    console.error('[GET /api/admin/teachers/list]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch teachers list' }, { status: 500 });
  }
}
