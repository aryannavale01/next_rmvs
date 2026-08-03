import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse } from "@/lib/session";
import { prisma, withRetry, dbErrorResponse } from "@/lib/prisma";
import { buildCertificatePdfBlob, type CertificatePdfData } from "@/lib/certificate-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  try {
    const { id } = await params;

    const cert = await withRetry(() =>
      prisma.certificate.findUnique({
        where: { id },
        include: {
          profile: { select: { fullName: true } },
          course: { select: { title: true } },
        },
      }),
    );
    if (!cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const data: CertificatePdfData = {
      certificateNumber: cert.certificateNumber,
      fullName: cert.profile.fullName,
      courseTitle: cert.course?.title ?? "Skill Development Program",
      teacherName: cert.teacherName,
      batch: cert.batch,
      completionDate: cert.completionDate?.toISOString() ?? null,
      issueDate: cert.issueDate?.toISOString() ?? null,
      verificationUrl: cert.verificationUrl,
      language: cert.language,
    };

    const blob = await buildCertificatePdfBlob([data]);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const safeName = cert.certificateNumber.replace(/[^a-zA-Z0-9-_]/g, "_");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error("[GET /api/admin/certificates/[id]/pdf]", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
