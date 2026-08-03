import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse } from "@/lib/session";
import { prisma, withRetry, dbErrorResponse } from "@/lib/prisma";
import { downloadFile } from "@/lib/supabase-storage";
import { BUCKETS } from "@/lib/upload-config";

export const dynamic = "force-dynamic";

const DOC_TYPE_TO_BUCKET: Record<string, string> = {
  aadhaar: BUCKETS.aadhaar,
  pan: BUCKETS.pan,
  rationCard: BUCKETS.rationCard,
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  try {
    const { docId } = await params;

    const doc = await withRetry(() =>
      prisma.beneficiaryDocument.findUnique({ where: { id: docId } }),
    );
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!doc.fileUrl) {
      return NextResponse.json({ error: "Document file not available" }, { status: 404 });
    }

    const bucket = DOC_TYPE_TO_BUCKET[doc.type];
    if (!bucket) {
      return NextResponse.json({ error: "Unknown document type" }, { status: 400 });
    }

    const { buffer, contentType } = await downloadFile(bucket, doc.fileUrl);
    const body = new Uint8Array(buffer);

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": body.length.toString(),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error("[GET /api/admin/documents/[docId]/image]", error);
    return NextResponse.json({ error: "Failed to fetch document image" }, { status: 500 });
  }
}
