import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { requireAdmin, authErrorResponse } from "@/lib/session";
import { prisma, withRetry, dbErrorResponse } from "@/lib/prisma";
import { buildCertificatePdfBlob, buildCertificatePdfBuffers, type CertificatePdfData } from "@/lib/certificate-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  try {
    const body = await request.json();
    const { courseId, certificateIds, format } = body as {
      courseId?: string;
      certificateIds?: string[];
      format?: "pdf" | "zip";
    };

    const where = {
      ...(courseId ? { courseId } : {}),
      ...(certificateIds?.length ? { id: { in: certificateIds } } : {}),
    };

    const certs = await withRetry(() =>
      prisma.certificate.findMany({
        where,
        include: {
          profile: { select: { fullName: true } },
          course: { select: { title: true } },
        },
        orderBy: { certificateNumber: "asc" },
      }),
    );

    if (certs.length === 0) {
      return NextResponse.json({ error: "No certificates found" }, { status: 404 });
    }

    const toPdfData = (cert: (typeof certs)[number]): CertificatePdfData => ({
      certificateNumber: cert.certificateNumber,
      fullName: cert.profile.fullName,
      courseTitle: cert.course?.title ?? "Skill Development Program",
      teacherName: cert.teacherName,
      batch: cert.batch,
      completionDate: cert.completionDate?.toISOString() ?? null,
      issueDate: cert.issueDate?.toISOString() ?? null,
      verificationUrl: cert.verificationUrl,
      language: cert.language,
    });

    const dateStamp = new Date().toISOString().split("T")[0];

    if (format === "zip") {
      const zip = new JSZip();
      const folder = zip.folder("certificates");
      const buffers = await buildCertificatePdfBuffers(certs.map(toPdfData));

      for (let i = 0; i < certs.length; i++) {
        const safeName = certs[i].certificateNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
        folder?.file(`${safeName}.pdf`, buffers[i]);
      }

      const zipBuffer = Buffer.from(await zip.generateAsync({ type: "uint8array" }));
      return new NextResponse(zipBuffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="certificates-${dateStamp}.zip"`,
          "Content-Length": zipBuffer.length.toString(),
        },
      });
    }

    const blob = await buildCertificatePdfBlob(certs.map(toPdfData));
    const buffer = Buffer.from(await blob.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificates-${dateStamp}.pdf"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error("[POST /api/admin/certificates/download]", error);
    return NextResponse.json({ error: "Failed to download certificates" }, { status: 500 });
  }
}
