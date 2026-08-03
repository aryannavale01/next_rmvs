import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse } from "@/lib/session";
import { prisma, withRetry, dbErrorResponse } from "@/lib/prisma";
import { downloadFile } from "@/lib/supabase-storage";
import { BUCKETS } from "@/lib/upload-config";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  try {
    const { profileId } = await params;

    const profile = await withRetry(() =>
      prisma.profile.findUnique({
        where: { id: profileId },
        select: { avatarUrl: true },
      }),
    );

    if (!profile || !profile.avatarUrl) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    const { buffer, contentType } = await downloadFile(BUCKETS.profilePhoto, profile.avatarUrl);
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
    console.error("[GET /api/admin/profile-photo/[profileId]]", error);
    return NextResponse.json({ error: "Failed to fetch profile photo" }, { status: 500 });
  }
}
