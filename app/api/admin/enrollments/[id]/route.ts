import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireStepUp, stepUpErrorResponse } from "@/lib/session";
import { prisma, withRetry, dbErrorResponse } from "@/lib/prisma";
import { PatchApplicationSchema } from "@/lib/validations/admin-enrollment";
import { logActivity } from "@/lib/activity-log";
import { getPublicUrl } from "@/lib/supabase-storage";
import { BUCKETS } from "@/lib/upload-config";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  const { id } = await params;

  try {
    const application = await withRetry(() =>
      prisma.courseApplication.findUnique({
        where: { id },
        include: {
          profile: true,
          course: {
            include: {
              syllabus: { orderBy: { sortOrder: "asc" } },
            },
          },
          adminNotes: {
            orderBy: { createdAt: "desc" },
          },
          couponRedemptions: {
            include: { coupon: { select: { code: true, discountType: true, discountValue: true } } },
          },
        },
      })
    );

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const enrollment = await withRetry(() =>
      prisma.courseEnrollment.findFirst({
        where: {
          profileId: application.profileId,
          courseId: application.courseId,
        },
      })
    );

    const courseAppCount = await withRetry(() =>
      prisma.courseApplication.count({
        where: { courseId: application.courseId },
      })
    );

    const enrollmentCount = await withRetry(() =>
      prisma.courseEnrollment.count({
        where: {
          courseId: application.courseId,
          status: { in: ["enrolled", "in_progress"] },
        },
      })
    );

    const data = {
      id: application.id,
      status: application.status,
      appliedDate: application.appliedDate.toISOString(),
      seatReservedAt: application.seatReservedAt?.toISOString() ?? null,
      waitlistedAt: application.waitlistedAt?.toISOString() ?? null,
      convertedAt: application.convertedAt?.toISOString() ?? null,
      reviewNotes: application.reviewNotes,
      rejectionReason: application.rejectionReason,
      reviewedAt: application.reviewedAt?.toISOString() ?? null,
      notes: application.notes,
      education: application.education,
      address: application.address,
      motivation: application.motivation,
      documents: application.documents,
      hasTestimonial: application.hasTestimonial,
      paymentStatus: application.paymentStatus,
      amountDue: application.amountDue?.toString() ?? null,
      amountPaid: application.amountPaid?.toString() ?? null,
      member: {
        id: application.profile.id,
        fullName: application.profile.fullName,
        email: application.profile.email,
        phone: application.profile.phone,
        gender: application.profile.gender,
        dob: application.profile.dob?.toISOString().split("T")[0] ?? null,
        district: application.profile.district,
        state: application.profile.state,
        aadhaarNumber: application.profile.aadhaarNumber,
        qualification: application.profile.qualification,
        avatarUrl: application.profile.avatarUrl ? getPublicUrl(BUCKETS.profilePhoto, application.profile.avatarUrl) : null,
        photoUrlHQ: application.profile.photoUrlHQ ? getPublicUrl(BUCKETS.profilePhoto, application.profile.photoUrlHQ) : null,
      },
      course: {
        id: application.course.id,
        title: application.course.title,
        category: application.course.category,
        level: application.course.level,
        duration: application.course.duration,
        seatsTotal: application.course.seatsTotal,
        totalApplications: courseAppCount,
        totalEnrolled: enrollmentCount,
      },
      enrollment: enrollment
        ? {
            id: enrollment.id,
            status: enrollment.status,
            enrollmentDate: enrollment.enrollmentDate.toISOString(),
            attendance: enrollment.attendance,
            batchLabel: enrollment.batchLabel,
            seatNumber: enrollment.seatNumber,
          }
        : null,
      adminNotes: application.adminNotes.map((n) => ({
        id: n.id,
        text: n.text,
        authorId: n.authorId,
        createdAt: n.createdAt.toISOString(),
      })),
      coupons: application.couponRedemptions.map((c) => ({
        code: c.coupon?.code ?? "",
        discountType: c.coupon?.discountType ?? "",
        discountValue: c.coupon?.discountValue?.toString() ?? null,
      })),
    };

    return NextResponse.json({ data });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error("[GET /api/admin/enrollments/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch application detail" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = PatchApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;

  try {
    const existing = await withRetry(() =>
      prisma.courseApplication.findUnique({
        where: { id },
        select: { id: true, status: true, profileId: true, courseId: true },
      })
    );

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (data.documentAction) {
      const { documentType, action } = data.documentAction;

      const fullApp = await withRetry(() =>
        prisma.courseApplication.findUnique({
          where: { id },
          select: { documents: true, status: true, courseId: true },
        })
      );

      if (!fullApp) {
        return NextResponse.json({ error: "Application not found" }, { status: 404 });
      }

      const docs = (fullApp.documents ?? []) as { type: string; status: string }[];
      const docIdx = docs.findIndex((d) => d.type === documentType);
      if (docIdx === -1) {
        return NextResponse.json({ error: `Document type "${documentType}" not found` }, { status: 404 });
      }

      const newStatus = action === "verify" ? "verified" : "rejected";
      const updatedDocs = [...docs];
      updatedDocs[docIdx] = { ...updatedDocs[docIdx], status: newStatus };
      const now = new Date();

      // Auto-transition status based on document verification state
      const allDocsVerified = updatedDocs.length > 0 && updatedDocs.every((d) => d.status === "verified");
      const anyDocRejected = updatedDocs.some((d) => d.status === "rejected");

      const updates: Record<string, unknown> = { documents: updatedDocs };
      let autoStatus: string | null = null;

      if (allDocsVerified && (fullApp.status === "pending" || fullApp.status === "under_review")) {
        updates.status = "documents_verified";
        autoStatus = "documents_verified";
      } else if (anyDocRejected && fullApp.status === "documents_verified") {
        updates.status = "under_review";
        autoStatus = "under_review";
      }

      await withRetry(() =>
        prisma.courseApplication.update({
          where: { id },
          data: updates,
        })
      );

      await withRetry(() =>
        prisma.beneficiaryDocument.updateMany({
          where: { profileId: existing.profileId, type: documentType },
          data: {
            status: newStatus === "verified" ? "verified" : "rejected",
            verifiedDate: now,
            verifiedBy: auth.session.user.id,
          },
        })
      );

      await logActivity({
        performedBy: auth.session.user.id,
        action: action === "verify" ? "document_verify" : "document_reject",
        entity: "enrollment",
        entityId: id,
        description: `Document "${documentType}" ${newStatus} by admin${autoStatus ? ` → status auto-set to "${autoStatus}"` : ""}`,
      });

      return NextResponse.json({
        data: { documents: updatedDocs, status: autoStatus ?? fullApp.status },
      });
    }

    const now = new Date();
    const updates: Record<string, unknown> = {};

    if (data.status) {
      if (data.status === "seat_reserved") {
        updates.status = "seat_reserved";
        updates.seatReservedAt = now;
        updates.convertedAt = now;
        updates.approvedById = auth.session.user.id;
        updates.reviewedAt = now;
        if (data.reviewNotes) updates.reviewNotes = data.reviewNotes;
      } else if (data.status === "waitlisted") {
        updates.status = "waitlisted";
        updates.waitlistedAt = now;
      } else if (data.status === "rejected") {
        updates.status = "rejected";
        updates.reviewedAt = now;
        if (data.rejectionReason) updates.rejectionReason = data.rejectionReason;
      } else if (data.status === "under_review") {
        updates.status = "under_review";
        if (data.reviewNotes) updates.reviewNotes = data.reviewNotes;
      } else if (data.status === "documents_verified") {
        updates.status = "documents_verified";
        if (data.reviewNotes) updates.reviewNotes = data.reviewNotes;
      } else if (data.status === "pending") {
        updates.status = "pending";
      }
    }

    if (data.reviewNotes !== undefined && !updates.reviewNotes) {
      updates.reviewNotes = data.reviewNotes;
    }

    let enrollmentCreated = false;

    if (data.status === "seat_reserved") {
      const existingEnrollment = await withRetry(() =>
        prisma.courseEnrollment.findFirst({
          where: { profileId: existing.profileId, courseId: existing.courseId },
        })
      );

      if (!existingEnrollment) {
        await withRetry(() =>
          prisma.$transaction([
            prisma.courseApplication.update({ where: { id }, data: updates }),
            prisma.courseEnrollment.create({
              data: {
                profileId: existing.profileId,
                courseId: existing.courseId,
                status: "enrolled",
                enrollmentDate: now,
              },
            }),
          ])
        );
        enrollmentCreated = true;
      } else {
        await withRetry(() =>
          prisma.courseApplication.update({ where: { id }, data: updates })
        );
      }
    } else {
      await withRetry(() =>
        prisma.courseApplication.update({ where: { id }, data: updates })
      );
    }

    await logActivity({
      performedBy: auth.session.user.id,
      action: "status_change",
      entity: "enrollment",
      entityId: id,
      description: `Application status changed from ${existing.status} to ${updates.status ?? existing.status}${enrollmentCreated ? " (enrollment created)" : ""}`,
    });

    return NextResponse.json({
      data: {
        id,
        status: updates.status ?? existing.status,
        seatReservedAt: (updates.seatReservedAt as Date)?.toISOString() ?? null,
        waitlistedAt: (updates.waitlistedAt as Date)?.toISOString() ?? null,
        reviewNotes: (updates.reviewNotes as string) ?? null,
        rejectionReason: (updates.rejectionReason as string) ?? null,
        enrollmentCreated,
      },
    });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error("[PATCH /api/admin/enrollments/[id]]", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
