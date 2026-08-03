import { NextResponse, NextRequest } from 'next/server';
import { requireAdmin, requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';

export const dynamic = 'force-dynamic';

function mapCoupon(c: any) {
  return {
    id: c.id,
    code: c.code,
    description: c.description,
    discountType: c.discountType,
    discountValue: Number(c.discountValue),
    expiresAt: c.expiresAt?.toISOString() || null,
    validFrom: c.validFrom?.toISOString() || null,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    perUserLimit: c.perUserLimit,
    minAmount: c.minAmount ? Number(c.minAmount) : null,
    courseId: c.courseId,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const coupons = await withRetry(() =>
      prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
      })
    );
    return NextResponse.json(coupons.map(mapCoupon));
  } catch (e) {
    const dbResp = dbErrorResponse(e);
    if (dbResp) return dbResp;
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const body = await req.json();
    const { code, description, discountType, discountValue, expiresAt, validFrom, maxUses, perUserLimit, minAmount, courseId, isActive } = body;

    if (!code || !description) {
      return NextResponse.json({ error: 'Code and description are required' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      return NextResponse.json({ error: 'Code cannot be empty' }, { status: 400 });
    }

    if (discountType !== 'percentage' && discountType !== 'fixed') {
      return NextResponse.json({ error: 'discountType must be "percentage" or "fixed"' }, { status: 400 });
    }

    if (typeof discountValue !== 'number' || discountValue < 0) {
      return NextResponse.json({ error: 'discountValue must be a non-negative number' }, { status: 400 });
    }

    if (discountType === 'percentage' && discountValue > 100) {
      return NextResponse.json({ error: 'Percentage discount cannot exceed 100%' }, { status: 400 });
    }

    if (discountType === 'fixed' && courseId) {
      const course = await withRetry(() => prisma.course.findUnique({ where: { id: courseId } }));
      if (course && course.price && discountValue > Number(course.price)) {
        return NextResponse.json({ error: 'Fixed discount cannot exceed course price' }, { status: 400 });
      }
    }

    if (expiresAt) {
      const expDate = new Date(expiresAt);
      if (isNaN(expDate.getTime())) {
        return NextResponse.json({ error: 'Invalid expiresAt date' }, { status: 400 });
      }
    }

    if (maxUses !== undefined && maxUses !== null && (typeof maxUses !== 'number' || maxUses <= 0)) {
      return NextResponse.json({ error: 'maxUses must be a positive number' }, { status: 400 });
    }

    if (perUserLimit !== undefined && perUserLimit !== null && (typeof perUserLimit !== 'number' || perUserLimit <= 0)) {
      return NextResponse.json({ error: 'perUserLimit must be a positive number' }, { status: 400 });
    }

    const effectiveCourseId = courseId === 'global' || courseId === '' ? null : courseId;

    if (effectiveCourseId) {
      const course = await withRetry(() => prisma.course.findUnique({ where: { id: effectiveCourseId } }));
      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }
    }

    const existing = await withRetry(() =>
      prisma.coupon.findFirst({
        where: { code: { equals: normalizedCode, mode: 'insensitive' } },
      })
    );
    if (existing) {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
    }

    const coupon = await withRetry(() =>
      prisma.coupon.create({
        data: {
          code: normalizedCode,
          description,
          discountType,
          discountValue,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          validFrom: validFrom ? new Date(validFrom) : null,
          maxUses: maxUses ?? null,
          perUserLimit: perUserLimit ?? null,
          minAmount: minAmount ?? null,
          courseId: effectiveCourseId,
          isActive: isActive !== false,
        },
      })
    );

    await logActivity({
      entity: 'coupon',
      entityId: coupon.id,
      action: 'coupon_create',
      description: `Created coupon ${coupon.code} (${coupon.discountType} ${coupon.discountValue})`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(mapCoupon(coupon), { status: 201 });
  } catch (e: any) {
    const dbResp = dbErrorResponse(e);
    if (dbResp) return dbResp;
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}
