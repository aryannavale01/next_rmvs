import { NextRequest, NextResponse } from "next/server";
import { requireStepUp, stepUpErrorResponse } from "@/lib/session";
import { prisma, withRetry, dbErrorResponse } from "@/lib/prisma";
import { generateCertificatesForEnrollments } from "@/lib/certificates";
import { logActivity } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

const ELIGIBLE_STATUSES = ["completed", "certified"];

export async function POST(request: NextRequest) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const body = await request.json();
    const { courseId, enrollmentIds } = body as { courseId?: string; enrollmentIds?: string[] };

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    const course = await withRetry(() =>
      prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true },
      })
    );
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const enrollments = await withRetry(() =>
      prisma.courseEnrollment.findMany({
        where: { courseId },
        select: {
          id: true,
          profileId: true,
          courseId: true,
          batchLabel: true,
          trainer: true,
          completionDate: true,
          status: true,
          profile: { select: { fullName: true } },
        },
      })
    );

    const existingCerts = await withRetry(() =>
      prisma.certificate.findMany({
        where: { courseId, status: { not: "revoked" } },
        select: { profileId: true },
      })
    );
    const certifiedProfiles = new Set(existingCerts.map((c) => c.profileId));

    const eligible = enrollments.filter(
      (e) => ELIGIBLE_STATUSES.includes(e.status) && !certifiedProfiles.has(e.profileId),
    );

    const requestedIds = new Set(enrollmentIds ?? []);
    const targets =
      requestedIds.size > 0
        ? eligible.filter((e) => requestedIds.has(e.id))
        : eligible;

    if (targets.length === 0) {
      return NextResponse.json(
        {
          error: "No eligible enrollments found",
          details:
            requestedIds.size > 0
              ? "The selected enrollments are not eligible (not completed or already certified)."
              : "No completed enrollments are awaiting a certificate.",
        },
        { status: 400 },
      );
    }

    const baseUrl = new URL(request.url).origin;

    const created = await withRetry(() =>
      prisma.$transaction(
        async (tx) =>
          generateCertificatesForEnrollments({
            tx,
            enrollments: targets,
            adminId: auth.session.user.id,
            baseUrl,
          }),
        { timeout: 60_000 },
      )
    );

    const nameById = new Map(enrollments.map((e) => [e.profileId, e.profile.fullName]));

    await logActivity({
      entity: "certificate",
      action: "certificate_generate",
      description: `Generated ${created.length} certificate${created.length === 1 ? "" : "s"} for course "${course.title}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({
      data: {
        generated: created.length,
        certificates: created.map((c) => ({
          id: c.id,
          certificateNumber: c.certificateNumber,
          memberName: nameById.get(c.profileId) ?? null,
          courseId: c.courseId,
          courseTitle: course.title,
          status: c.status,
          generationDate: c.generationDate ? c.generationDate.toISOString() : null,
        })),
      },
    });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error("[POST /api/admin/certificates/generate]", error);
    return NextResponse.json({ error: "Failed to generate certificates" }, { status: 500 });
  }
}
