import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(new Headers(req.headers));
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { courseId, couponCode, documents } = await req.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const userId = auth.session.user.id;

    const existing = await prisma.courseApplication.findUnique({
      where: { profileId_courseId: { profileId: userId, courseId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Already applied to this course' }, { status: 409 });
    }

    let finalPrice = Number(course.price || 0);
    let appliedCouponId: string | null = null;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const normalizedCode = couponCode.trim().toUpperCase();

      const couponResult = await prisma.$transaction(async (tx) => {
        const coupon = await tx.coupon.findFirst({
          where: { code: { equals: normalizedCode, mode: 'insensitive' } },
        });

        if (!coupon) throw new Error('COUPON_NOT_FOUND');
        if (!coupon.isActive) throw new Error('COUPON_INACTIVE');
        if (coupon.validFrom && coupon.validFrom > new Date()) throw new Error('COUPON_NOT_YET_VALID');
        if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new Error('COUPON_EXPIRED');
        if (coupon.courseId && coupon.courseId !== courseId) throw new Error('COUPON_WRONG_COURSE');
        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) throw new Error('COUPON_EXHAUSTED');

        if (coupon.perUserLimit !== null) {
          const count = await tx.couponRedemption.count({
            where: { couponId: coupon.id, userId },
          });
          if (count >= coupon.perUserLimit) throw new Error('COUPON_USER_LIMIT');
        }

        const discount = coupon.discountType === 'percentage'
          ? Math.round((finalPrice * Number(coupon.discountValue)) / 100)
          : Number(coupon.discountValue);
        finalPrice = Math.max(0, finalPrice - discount);

        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });

        return coupon;
      });

      appliedCouponId = couponResult.id;
    }

    const application = await prisma.courseApplication.create({
      data: {
        profileId: userId,
        courseId,
        amountDue: finalPrice,
        status: 'pending',
        couponApplied: !!appliedCouponId,
        documents: documents || undefined,
      },
    });

    if (appliedCouponId) {
      await prisma.couponRedemption.create({
        data: {
          couponId: appliedCouponId,
          userId,
          courseApplicationId: application.id,
        },
      });
    }

    return NextResponse.json({
      application: { id: application.id, courseId: application.courseId, status: application.status },
      finalPrice,
      couponApplied: !!appliedCouponId,
    }, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Already applied to this course' }, { status: 409 });
    }
    const reasonMap: Record<string, string> = {
      COUPON_NOT_FOUND: 'Coupon code not found',
      COUPON_INACTIVE: 'Coupon is no longer active',
      COUPON_NOT_YET_VALID: 'Coupon is not yet valid',
      COUPON_EXPIRED: 'Coupon has expired',
      COUPON_WRONG_COURSE: 'Coupon is not valid for this course',
      COUPON_EXHAUSTED: 'Coupon has reached its usage limit',
      COUPON_USER_LIMIT: 'You have already used this coupon the maximum number of times',
    };
    const msg = reasonMap[e.message] || 'Failed to submit application';
    const status = reasonMap[e.message] ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
