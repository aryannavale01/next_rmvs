import { NextRequest, NextResponse } from "next/server";
import { requireAuth, authErrorResponse } from "@/lib/session";
import { prisma, withRetry, dbErrorResponse } from "@/lib/prisma";
import { generateSignedUrl } from "@/lib/supabase-storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.success) {
    return authErrorResponse(auth) as NextResponse;
  }

  try {
    const { id } = await params;

    // Get the user's profile
    const profile = await withRetry(() =>
      prisma.profile.findFirst({
        where: { id: auth.session.user.id },
        select: { id: true },
      })
    );

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const cert = await withRetry(() =>
      prisma.certificate.findUnique({
        where: { id },
        select: {
          id: true,
          profileId: true,
          pdfStoragePath: true,
          status: true,
          certificateNumber: true,
        },
      })
    );

    if (!cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    if (cert.profileId !== profile.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (cert.status === "revoked") {
      return NextResponse.json(
        { error: "This certificate has been revoked and can no longer be downloaded." },
        { status: 410 }
      );
    }

    if (cert.status === "pending" || cert.status === "generated") {
      return NextResponse.json(
        { error: "Certificate is not yet approved. Please wait or contact support." },
        { status: 409 }
      );
    }

    if (!cert.pdfStoragePath) {
      return NextResponse.json(
        { error: "PDF not yet generated. Please wait or contact support." },
        { status: 404 }
      );
    }

    // Generate a signed URL (30 days expiry for certificates)
    const signedUrl = await generateSignedUrl("certificates", cert.pdfStoragePath, 2592000);

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error("[GET /api/member/certificates/[id]/download]", error);
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }
}
