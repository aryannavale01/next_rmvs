import { NextResponse, NextRequest } from 'next/server';
import { requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';

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
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const current = await withRetry(() =>
      prisma.coupon.findUnique({ where: { id } })
    );
    if (!current) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};

    if (body.code !== undefined) {
      const normalizedCode = body.code.trim().toUpperCase();
      if (!normalizedCode || normalizedCode.length > 50) {
        return NextResponse.json({ error: 'Code must be 1-50 characters' }, { status: 400 });
      }
      const duplicate = await withRetry(() =>
        prisma.coupon.findFirst({
          where: { code: { equals: normalizedCode, mode: 'insensitive' }, id: { not: id }, status: { not: 'deleted' } },
        })
      );
      if (duplicate) {
        return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
      }
      updateData.code = normalizedCode;
    }

    if (body.description !== undefined) {
      if (body.description !== null && (typeof body.description !== 'string' || body.description.length > 500)) {
        return NextResponse.json({ error: 'description must be a string of at most 500 characters' }, { status: 400 });
      }
      updateData.description = body.description;
    }

    // Effective discount pair (fall back to stored values so single-field
    // updates are still validated against each other).
    const effType = body.discountType !== undefined ? body.discountType : current.discountType;
    const effValue = body.discountValue !== undefined ? body.discountValue : Number(current.discountValue);

    if (body.discountType !== undefined) {
      if (effType !== 'percentage' && effType !== 'fixed') {
        return NextResponse.json({ error: 'discountType must be "percentage" or "fixed"' }, { status: 400 });
      }
      updateData.discountType = effType;
    }

    if (body.discountValue !== undefined) {
      if (typeof effValue !== 'number' || !Number.isFinite(effValue) || effValue < 0) {
        return NextResponse.json({ error: 'discountValue must be a non-negative number' }, { status: 400 });
      }
      if (effType === 'percentage' && effValue > 100) {
        return NextResponse.json({ error: 'Percentage discount cannot exceed 100%' }, { status: 400 });
      }
      if (effType === 'fixed' && effValue > 1_000_000) {
        return NextResponse.json({ error: 'Fixed discount cannot exceed ₹1,000,000' }, { status: 400 });
      }
      updateData.discountValue = effValue;
    } else if (effType === 'percentage' && Number(current.discountValue) > 100) {
      // Type switched to percentage without an accompanying value that fits.
      return NextResponse.json({ error: 'Existing discount value exceeds 100% — provide a valid discountValue' }, { status: 400 });
    }

    const effValidFrom = body.validFrom !== undefined ? body.validFrom : current.validFrom?.toISOString() ?? null;
    const effExpiresAt = body.expiresAt !== undefined ? body.expiresAt : current.expiresAt?.toISOString() ?? null;

    if (body.expiresAt !== undefined) {
      if (body.expiresAt === null) {
        updateData.expiresAt = null;
      } else {
        const d = new Date(body.expiresAt);
        if (Number.isNaN(d.getTime())) {
          return NextResponse.json({ error: 'expiresAt must be a valid date' }, { status: 400 });
        }
        updateData.expiresAt = d;
      }
    }

    if (body.validFrom !== undefined) {
      if (body.validFrom === null) {
        updateData.validFrom = null;
      } else {
        const d = new Date(body.validFrom);
        if (Number.isNaN(d.getTime())) {
          return NextResponse.json({ error: 'validFrom must be a valid date' }, { status: 400 });
        }
        updateData.validFrom = d;
      }
    }

    if (
      effValidFrom && effExpiresAt &&
      new Date(effValidFrom).getTime() >= new Date(effExpiresAt).getTime()
    ) {
      return NextResponse.json({ error: 'validFrom must be before expiresAt' }, { status: 400 });
    }

    if (body.maxUses !== undefined) {
      if (body.maxUses === null) {
        updateData.maxUses = null;
      } else {
        const n = Number(body.maxUses);
        if (!Number.isInteger(n) || n < 1 || n > 1_000_000) {
          return NextResponse.json({ error: 'maxUses must be an integer between 1 and 1,000,000 (or null)' }, { status: 400 });
        }
        updateData.maxUses = n;
      }
    }

    if (body.perUserLimit !== undefined) {
      if (body.perUserLimit === null) {
        updateData.perUserLimit = null;
      } else {
        const n = Number(body.perUserLimit);
        if (!Number.isInteger(n) || n < 1 || n > 1000) {
          return NextResponse.json({ error: 'perUserLimit must be an integer between 1 and 1000 (or null)' }, { status: 400 });
        }
        updateData.perUserLimit = n;
      }
    }

    if (body.minAmount !== undefined) {
      if (body.minAmount === null) {
        updateData.minAmount = null;
      } else {
        const n = Number(body.minAmount);
        if (!Number.isFinite(n) || n < 0 || n > 10_000_000) {
          return NextResponse.json({ error: 'minAmount must be a number between 0 and 10,000,000 (or null)' }, { status: 400 });
        }
        updateData.minAmount = n;
      }
    }

    if (body.courseId !== undefined) {
      const cid = body.courseId === 'global' || body.courseId === '' ? null : body.courseId;
      if (cid !== null) {
        if (typeof cid !== 'string') {
          return NextResponse.json({ error: 'courseId must be a string, "global", or null' }, { status: 400 });
        }
        const course = await withRetry(() =>
          prisma.course.findUnique({ where: { id: cid }, select: { id: true } })
        );
        if (!course) {
          return NextResponse.json({ error: 'Course not found' }, { status: 400 });
        }
      }
      updateData.courseId = cid;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(mapCoupon(current));
    }

    const coupon = await withRetry(() =>
      prisma.coupon.update({
        where: { id },
        data: updateData,
      })
    );

    await logActivity({
      entity: 'coupon',
      entityId: coupon.id,
      action: 'coupon_update',
      description: `Updated coupon ${coupon.code}`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(mapCoupon(coupon));
  } catch (e: any) {
    const dbResp = dbErrorResponse(e);
    if (dbResp) return dbResp;
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
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  const { id } = await params;

  try {
    const existing = await withRetry(() =>
      prisma.coupon.findUnique({
        where: { id },
        select: { code: true },
      })
    );
    if (!existing) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    const redemptionCount = await withRetry(() =>
      prisma.couponRedemption.count({
        where: { couponId: id },
      })
    );

    if (redemptionCount > 0) {
      const coupon = await withRetry(() =>
        prisma.coupon.update({
          where: { id },
          data: { isActive: false },
        })
      );
      await logActivity({
        entity: 'coupon',
        entityId: id,
        action: 'coupon_delete',
        description: `Deactivated coupon ${existing.code} (has redemptions)`,
        performedBy: auth.session.user.id,
      });
      return NextResponse.json({ deleted: false, deactivated: true, coupon: mapCoupon(coupon) });
    }

      await withRetry(() => prisma.coupon.update({ where: { id }, data: { status: 'deleted', deletedAt: new Date() } }));
    await logActivity({
      entity: 'coupon',
      entityId: id,
      action: 'coupon_delete',
      description: `Deleted coupon ${existing.code}`,
      performedBy: auth.session.user.id,
    });
    return NextResponse.json({ deleted: true, deactivated: false });
  } catch (e: any) {
    const dbResp = dbErrorResponse(e);
    if (dbResp) return dbResp;
    if (e?.code === 'P2025') {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
