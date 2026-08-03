import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireStepUp, stepUpErrorResponse } from "@/lib/session";
import { prisma, withRetry, dbErrorResponse } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const remarks = typeof body.remarks === "string" ? body.remarks.slice(0, 500) : null;

    const cert = await withRetry(() =>
      prisma.certificate.findUnique({
        where: { id },
        select: { id: true, status: true, certificateNumber: true, profileId: true, courseId: true },
      })
    );
    if (!cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }
    if (cert.status === "revoked") {
      return NextResponse.json({ data: { certificate: { id, status: "revoked" } } });
    }

    const operations: Prisma.PrismaPromise<unknown>[] = [
      prisma.certificate.update({
        where: { id },
        data: { status: "revoked", remarks: remarks ?? undefined },
      }),
    ];

    // Reset the enrollment so the certificate can be regenerated.
    if (cert.courseId) {
      operations.push(
        prisma.courseEnrollment.updateMany({
          where: { profileId: cert.profileId, courseId: cert.courseId },
          data: { certificateGenerated: false, status: "completed" },
        }),
      );
    }

    await withRetry(() => prisma.$transaction(operations));

    await logActivity({
      entity: "certificate",
      entityId: id,
      action: "certificate_revoke",
      description: `Revoked certificate ${cert.certificateNumber}${remarks ? ` (${remarks})` : ""}`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({
      data: { certificate: { id, status: "revoked" }, regenerable: true },
    });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error("[POST /api/admin/certificates/[id]/reject]", error);
    return NextResponse.json({ error: "Failed to reject certificate" }, { status: 500 });
  }
}
