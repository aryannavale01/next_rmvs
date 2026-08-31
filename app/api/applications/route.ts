import { NextResponse, NextRequest } from 'next/server';
import { requireAuth, authErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(new Headers(req.headers));
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  const rateLimit = checkRateLimit(req, 'applications_post', 10, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  try {
    const { courseId, couponCode, documents, education, address, motivation } = await req.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    const course = await withRetry(() => prisma.course.findUnique({ where: { id: courseId } }));
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const userId = auth.session.user.id;

    const existing = await withRetry(() =>
      prisma.courseApplication.findUnique({
        where: { profileId_courseId: { profileId: userId, courseId } },
      })
    );
    if (existing) {
      return NextResponse.json({ error: 'Already applied to this course' }, { status: 409 });
    }

    // H3: Server-verify any claimed document recordIds belong to this member and
    // are actually uploaded. Never trust the client's self-asserted document list.
    let verifiedDocuments: Record<string, { name: string; date: string; recordId: string }> | undefined;
    if (documents && typeof documents === 'object') {
      const claimed = documents as Record<string, { name?: string; date?: string; recordId?: string } | undefined>;
      const claimedEntries = Object.entries(claimed).filter(
        ([key, entry]) => entry && typeof entry.recordId === 'string',
      );

      if (claimedEntries.length > 0) {
        const claimedRecordIds = claimedEntries.map(([, entry]) => (entry as { recordId: string }).recordId);
        const ownedDocs = await withRetry(() =>
          prisma.beneficiaryDocument.findMany({
            where: { id: { in: claimedRecordIds }, profileId: userId },
            select: { id: true, type: true, label: true, fileUrl: true },
          })
        );

        const ownedById = new Map(ownedDocs.map(d => [d.id, d]));
        verifiedDocuments = {};

        for (const [key, entry] of claimedEntries) {
          const entryObj = entry as { name?: string; date?: string; recordId: string };
          const doc = ownedById.get(entryObj.recordId);
          // Reject claims for documents that don't exist, belong to someone
          // else, were claimed under the wrong type, or were never uploaded.
          if (!doc || doc.type !== key || !doc.fileUrl) {
            return NextResponse.json(
              { error: `Pending documents could not be verified. Please re-upload your ${key} document.` },
              { status: 400 },
            );
          }
          verifiedDocuments[key] = {
            name: doc.label || entryObj.name || key,
            date: entryObj.date || new Date().toISOString().split('T')[0],
            recordId: doc.id,
          };
        }
      }
    }

    const { finalPrice, appliedCouponId, application } = await withRetry(() =>
      prisma.$transaction(async (tx) => {
        let finalPrice = Number(course.price || 0);
        let appliedCouponId: string | null = null;

        if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
          const normalizedCode = couponCode.trim().toUpperCase();

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

          appliedCouponId = coupon.id;
        }

        const application = await tx.courseApplication.create({
          data: {
            profileId: userId,
            courseId,
            amountDue: finalPrice,
            status: 'pending',
            couponApplied: !!appliedCouponId,
            education: education || undefined,
            address: address || undefined,
            motivation: motivation || undefined,
            documents: verifiedDocuments,
          },
        });

        if (appliedCouponId) {
          // Only increment usage + record redemption if the application was
          // actually created, so coupon counters never drift on failure.
          await tx.coupon.update({
            where: { id: appliedCouponId },
            data: { usedCount: { increment: 1 } },
          });
          await tx.couponRedemption.create({
            data: {
              couponId: appliedCouponId,
              userId,
              courseApplicationId: application.id,
            },
          });
        }

        return { finalPrice, appliedCouponId, application };
      })
    );

    return NextResponse.json({
      application: { id: application.id, courseId: application.courseId, status: application.status },
      finalPrice,
      couponApplied: !!appliedCouponId,
    }, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Already applied to this course' }, { status: 409 });
    }
    const dbResp = dbErrorResponse(e);
    if (dbResp) return dbResp;
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
