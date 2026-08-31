import { NextRequest, NextResponse } from "next/server";
import { requireStepUp, stepUpErrorResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  generateCertificatesForEnrollments,
  nextCertificateNumber,
} from "@/lib/certificates";
import { buildVerificationUrl } from "@/lib/certificate-pdf";
import { logActivity } from "@/lib/activity-log";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action as string | undefined;
    const notes = typeof body.notes === "string" ? body.notes.slice(0, 500) : null;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const req = await prisma.certificateRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        profileId: true,
        courseId: true,
        batch: true,
        profile: { select: { fullName: true } },
        course: { select: { title: true } },
      },
    });
    if (!req) {
      return NextResponse.json({ error: "Certificate request not found" }, { status: 404 });
    }
    if (req.status !== "pending") {
      return NextResponse.json({ error: "This request has already been resolved" }, { status: 400 });
    }

    if (action === "reject") {
      const updated = await prisma.certificateRequest.update({
        where: { id },
        data: { status: "rejected", notes: notes ?? undefined },
        select: { id: true, status: true, notes: true },
      });
      await logActivity({
        entity: "certificate",
        entityId: id,
        action: "certificate_request_reject",
        description: `Rejected certificate request for ${req.profile.fullName}`,
        performedBy: auth.session.user.id,
      });
      return NextResponse.json({ data: { request: updated } });
    }

    const baseUrl = new URL(request.url).origin;
    const year = new Date().getFullYear();
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      let certificate: { id: string; certificateNumber: string; verificationCode: string | null; profileId: string; status: string };

      const enrollment = req.courseId
        ? await tx.courseEnrollment.findFirst({
            where: { profileId: req.profileId, courseId: req.courseId },
            select: {
              id: true,
              profileId: true,
              courseId: true,
              batchLabel: true,
              trainer: true,
              completionDate: true,
              status: true,
            },
          })
        : null;

      if (enrollment && enrollment.status !== "dropped") {
        const [created] = await generateCertificatesForEnrollments({
          tx,
          enrollments: [
            {
              id: enrollment.id,
              profileId: enrollment.profileId,
              courseId: enrollment.courseId,
              batchLabel: enrollment.batchLabel,
              trainer: enrollment.trainer,
              completionDate: enrollment.completionDate,
              memberName: req.profile.fullName,
              courseName: req.course?.title ?? "Course",
            },
          ],
          adminId: auth.session.user.id,
          baseUrl,
          year,
        });
        certificate = created;
      } else {
        const certificateNumber = await nextCertificateNumber(tx, year);
        const verificationCode = crypto.randomBytes(16).toString("base64url");
        certificate = await tx.certificate.create({
          data: {
            certificateNumber,
            verificationCode,
            profileId: req.profileId,
            courseId: req.courseId,
            memberName: req.profile.fullName,
            courseName: req.course?.title ?? "Course",
            batch: req.batch ?? enrollment?.batchLabel ?? null,
            teacherName: enrollment?.trainer ?? null,
            completionDate: enrollment?.completionDate ?? null,
            generationDate: now,
            status: "pending",
            publishedStatus: "pending",
            templateName: "default",
            language: "English",
            verificationUrl: buildVerificationUrl(baseUrl, verificationCode),
            generatedBy: auth.session.user.id,
          },
          select: { id: true, certificateNumber: true, verificationCode: true, profileId: true, status: true },
        });
      }

      await tx.certificateRequest.update({
        where: { id },
        data: { status: "approved", notes: notes ?? undefined },
      });

      return certificate;
    }, { timeout: 60_000 });

    await logActivity({
      entity: "certificate",
      entityId: id,
      action: "certificate_request_approve",
      description: `Approved certificate request for ${req.profile.fullName} (${result.certificateNumber})`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({
      data: {
        request: { id, status: "approved" },
        certificate: {
          id: result.id,
          certificateNumber: result.certificateNumber,
          verificationCode: result.verificationCode,
          status: result.status,
          memberName: req.profile.fullName,
        },
      },
    });
  } catch (error) {
    console.error("[POST /api/admin/certificates/requests/[id]]", error);
    return NextResponse.json({ error: "Failed to resolve certificate request" }, { status: 500 });
  }
}
