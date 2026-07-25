import { NextResponse, NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';

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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(coupons.map(mapCoupon));
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      const course = await prisma.course.findUnique({ where: { id: courseId } });
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
      const course = await prisma.course.findUnique({ where: { id: effectiveCourseId } });
      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }
    }

    const existing = await prisma.coupon.findFirst({
      where: { code: { equals: normalizedCode, mode: 'insensitive' } },
    });
    if (existing) {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
    }

    const coupon = await prisma.coupon.create({
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
    });

    return NextResponse.json(mapCoupon(coupon), { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}
