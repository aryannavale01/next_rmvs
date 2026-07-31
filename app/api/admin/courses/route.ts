import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { mapCourseToAdminShape, buildPrismaCreateData, slugify } from '@/lib/course-mapping';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES = new Set(['Agriculture', 'Tech', 'Healthcare', 'Business']);
const VALID_MODES = new Set(['Online', 'Offline', 'Hybrid']);
const VALID_STATUSES = new Set(['Draft', 'Published']);

function invalidCategory(category: unknown): string | null {
  if (category === undefined || category === '') return null;
  return typeof category === 'string' && VALID_CATEGORIES.has(category) ? null : 'Invalid category';
}

function invalidMode(mode: unknown): string | null {
  if (mode === undefined || mode === '') return null;
  return typeof mode === 'string' && VALID_MODES.has(mode) ? null : 'Invalid mode';
}

function invalidStatus(status: unknown): string | null {
  if (status === undefined || status === '') return null;
  return typeof status === 'string' && VALID_STATUSES.has(status) ? null : 'Invalid status';
}

function couponCodes(body: Record<string, unknown>): string[] {
  if (!Array.isArray(body.coupons)) return [];
  return body.coupons
    .map((c: any) => String(c?.code ?? '').trim().toUpperCase())
    .filter(Boolean);
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const courses = await prisma.course.findMany({
      where: { status: { not: 'archived' } },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            applications: { where: { status: { not: 'deleted' } } },
            enrollments: { where: { status: { notIn: ['dropped', 'completed'] } } },
          },
        },
        syllabus: { orderBy: { sortOrder: 'asc' } },
        coupons: true,
      },
    });

    const result = courses.map((c) =>
      mapCourseToAdminShape(c, {
        seatsEnrolled: c._count.enrollments,
        totalApplications: c._count.applications,
      }),
    );

    return NextResponse.json(result);
  } catch (e) {
    console.error('[GET /api/admin/courses]', e);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.title || !String(body.title).trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const categoryError = invalidCategory(body.category);
    if (categoryError) return NextResponse.json({ error: categoryError }, { status: 400 });
    const modeError = invalidMode(body.mode);
    if (modeError) return NextResponse.json({ error: modeError }, { status: 400 });
    const statusError = invalidStatus(body.status);
    if (statusError) return NextResponse.json({ error: statusError }, { status: 400 });

    const slug = slugify(body.title as string);
    const existingBySlug = await prisma.course.findUnique({ where: { slug } });
    if (existingBySlug) {
      return NextResponse.json({ error: 'A course with this title already exists' }, { status: 409 });
    }

    const codes = couponCodes(body);
    if (codes.length > 0) {
      const existingCoupon = await prisma.coupon.findFirst({
        where: { code: { in: codes, mode: 'insensitive' } },
      });
      if (existingCoupon) {
        return NextResponse.json(
          { error: `Coupon code "${existingCoupon.code}" is already in use` },
          { status: 409 },
        );
      }
    }

    // Derive instructor display fields from the selected teacher
    if (body.teacher_id) {
      const teacher = await prisma.teacher.findUnique({ where: { id: body.teacher_id as string } });
      if (teacher) {
        body.instructorName = teacher.fullName ?? '';
        body.instructorRole = teacher.designation ?? '';
        body.instructorImage = teacher.profilePhoto ?? '';
      }
    }

    const createData = buildPrismaCreateData(body);

    const course = await prisma.course.create({ data: createData as any });

    await logActivity({
      entity: 'course',
      entityId: course.id,
      action: 'create',
      description: `Created course "${course.title}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(
      { course: mapCourseToAdminShape(course) },
      { status: 201 },
    );
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'A course or coupon with this title/code already exists' }, { status: 409 });
    }
    console.error('[POST /api/admin/courses]', e);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
