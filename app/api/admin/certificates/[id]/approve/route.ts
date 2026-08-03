import { NextRequest, NextResponse } from "next/server";
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

    const cert = await withRetry(() =>
      prisma.certificate.findUnique({
        where: { id },
        select: { id: true, status: true, certificateNumber: true },
      })
    );
    if (!cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }
    if (cert.status === "revoked") {
      return NextResponse.json({ error: "A revoked certificate cannot be approved" }, { status: 400 });
    }
    if (cert.status === "approved") {
      return NextResponse.json({ data: { certificate: cert } });
    }

    const updated = await withRetry(() =>
      prisma.certificate.update({
        where: { id },
        data: {
          status: "approved",
          verifiedBy: auth.session.user.id,
          issueDate: new Date(),
          publishedStatus: "published",
        },
        select: {
          id: true,
          certificateNumber: true,
          status: true,
          publishedStatus: true,
          issueDate: true,
        },
      })
    );

    await logActivity({
      entity: "certificate",
      entityId: id,
      action: "certificate_approve",
      description: `Approved certificate ${cert.certificateNumber}`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({ data: { certificate: updated } });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error("[POST /api/admin/certificates/[id]/approve]", error);
    return NextResponse.json({ error: "Failed to approve certificate" }, { status: 500 });
  }
}
