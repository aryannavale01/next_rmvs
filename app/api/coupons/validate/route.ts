import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(new Headers(req.headers));
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { code, courseId } = await req.json();

    if (!code || !courseId) {
      return NextResponse.json({ error: 'Missing code or courseId' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    const coupon = await prisma.coupon.findFirst({
      where: { code: { equals: normalizedCode, mode: 'insensitive' } },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, reason: 'inactive' }, { status: 400 });
    }

    if (coupon.validFrom && coupon.validFrom > new Date()) {
      return NextResponse.json({ valid: false, reason: 'not_yet_valid' }, { status: 400 });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, reason: 'expired' }, { status: 400 });
    }

    if (coupon.courseId && coupon.courseId !== courseId) {
      return NextResponse.json({ valid: false, reason: 'wrong_course' }, { status: 400 });
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, reason: 'exhausted' }, { status: 400 });
    }

    if (coupon.perUserLimit !== null) {
      const userRedemptions = await prisma.couponRedemption.count({
        where: { couponId: coupon.id, userId: auth.session.user.id },
      });
      if (userRedemptions >= coupon.perUserLimit) {
        return NextResponse.json({ valid: false, reason: 'user_limit_reached' }, { status: 400 });
      }
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ valid: false, reason: 'course_not_found' }, { status: 404 });
    }

    if (coupon.minAmount && course.price && Number(course.price) < Number(coupon.minAmount)) {
      return NextResponse.json({ valid: false, reason: 'below_min_amount', minAmount: Number(coupon.minAmount) }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 });
  }
}
