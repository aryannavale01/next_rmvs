import { NextResponse, NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const updateData: Record<string, any> = {};

    if (body.code !== undefined) {
      const normalizedCode = body.code.trim().toUpperCase();
      if (!normalizedCode) {
        return NextResponse.json({ error: 'Code cannot be empty' }, { status: 400 });
      }
      const existing = await prisma.coupon.findFirst({
        where: { code: { equals: normalizedCode, mode: 'insensitive' }, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
      }
      updateData.code = normalizedCode;
    }

    if (body.description !== undefined) updateData.description = body.description;

    if (body.discountType !== undefined) {
      if (body.discountType !== 'percentage' && body.discountType !== 'fixed') {
        return NextResponse.json({ error: 'discountType must be "percentage" or "fixed"' }, { status: 400 });
      }
      updateData.discountType = body.discountType;
    }

    if (body.discountValue !== undefined) {
      if (typeof body.discountValue !== 'number' || body.discountValue < 0) {
        return NextResponse.json({ error: 'discountValue must be a non-negative number' }, { status: 400 });
      }
      updateData.discountValue = body.discountValue;
    }

    if (body.discountType === 'percentage' && body.discountValue > 100) {
      return NextResponse.json({ error: 'Percentage discount cannot exceed 100%' }, { status: 400 });
    }

    if (body.expiresAt !== undefined) {
      updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }

    if (body.validFrom !== undefined) {
      updateData.validFrom = body.validFrom ? new Date(body.validFrom) : null;
    }

    if (body.maxUses !== undefined) {
      updateData.maxUses = body.maxUses === null ? null : Number(body.maxUses);
    }

    if (body.perUserLimit !== undefined) {
      updateData.perUserLimit = body.perUserLimit === null ? null : Number(body.perUserLimit);
    }

    if (body.minAmount !== undefined) {
      updateData.minAmount = body.minAmount === null ? null : Number(body.minAmount);
    }

    if (body.courseId !== undefined) {
      updateData.courseId = body.courseId === 'global' || body.courseId === '' ? null : body.courseId;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(mapCoupon(coupon));
  } catch (e: any) {
    if (e?.code === 'P2025') {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const redemptionCount = await prisma.couponRedemption.count({
      where: { couponId: id },
    });

    if (redemptionCount > 0) {
      const coupon = await prisma.coupon.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ deleted: false, deactivated: true, coupon: mapCoupon(coupon) });
    }

    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ deleted: true, deactivated: false });
  } catch (e: any) {
    if (e?.code === 'P2025') {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
