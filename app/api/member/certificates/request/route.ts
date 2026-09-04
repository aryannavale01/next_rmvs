import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/session";
import { prisma, withRetry, dbErrorResponse } from "@/lib/prisma";
import { generateCertificatesForEnrollments } from "@/lib/certificates";
import { getVerificationBaseUrl } from "@/lib/certificate-pdf";
import { logActivity } from "@/lib/activity-log";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.success) {
    return authErrorResponse(auth) as NextResponse;
  }

  const rateLimit = checkRateLimit(request, "cert_request", 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  try {
    const body = await request.json();
    const { courseId } = body as { courseId?: string };

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    // Get the user's profile
    const profile = await withRetry(() =>
      prisma.profile.findFirst({
        where: { id: auth.session.user.id },
        select: { id: true, fullName: true },
      })
    );

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check if a certificate already exists for this enrollment
    const existingCert = await withRetry(() =>
      prisma.certificate.findFirst({
        where: {
          profileId: profile.id,
          courseId,
          status: { not: "revoked" },
        },
        select: { id: true },
      })
    );

    if (existingCert) {
      return NextResponse.json(
        { error: "Certificate already exists for this course" },
        { status: 409 }
      );
    }

    // Find the enrollment
    const enrollment = await withRetry(() =>
      prisma.courseEnrollment.findFirst({
        where: {
          profileId: profile.id,
          courseId,
          status: { in: ["completed", "certified"] },
        },
        select: {
          id: true,
          profileId: true,
          courseId: true,
          batchLabel: true,
          trainer: true,
          completionDate: true,
          course: { select: { title: true } },
        },
      })
    );

    if (!enrollment) {
      return NextResponse.json(
        { error: "No completed enrollment found for this course" },
        { status: 404 }
      );
    }

    const baseUrl = getVerificationBaseUrl(new URL(request.url).origin);

    const created = await withRetry(() =>
      prisma.$transaction(
        async (tx) =>
          generateCertificatesForEnrollments({
            tx,
            enrollments: [
              {
                id: enrollment.id,
                profileId: enrollment.profileId,
                courseId: enrollment.courseId,
                batchLabel: enrollment.batchLabel,
                trainer: enrollment.trainer,
                completionDate: enrollment.completionDate,
                memberName: profile.fullName,
                courseName: enrollment.course?.title ?? "Course",
              },
            ],
            adminId: auth.session.user.id,
            baseUrl,
          }),
        { timeout: 30_000 },
      )
    );

    await logActivity({
      entity: "certificate",
      entityId: created[0].id,
      action: "certificate_request",
      description: `Member requested certificate for "${enrollment.course?.title}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({
      certificate: {
        id: created[0].id,
        certificateNumber: created[0].certificateNumber,
        verificationCode: created[0].verificationCode,
        memberName: created[0].memberName ?? profile.fullName,
        courseName: created[0].courseName ?? enrollment.course?.title,
        completionDate: enrollment.completionDate?.toISOString() ?? null,
        verificationUrl: created[0].verificationUrl,
        status: created[0].status,
      },
    });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error("[POST /api/member/certificates/request]", error);
    return NextResponse.json({ error: "Failed to request certificate" }, { status: 500 });
  }
}
