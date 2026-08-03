import { NextRequest, NextResponse } from "next/server";
import type { RequestStatus } from "@prisma/client";
import { requireAdmin, authErrorResponse } from "@/lib/session";
import { prisma, withRetry, dbErrorResponse } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_STATUSES: RequestStatus[] = ["pending", "approved", "rejected"];

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  try {
    const raw = request.nextUrl.searchParams.get("status");
    const where = raw && (VALID_STATUSES as string[]).includes(raw)
      ? { status: raw as RequestStatus }
      : {};

    const requests = await withRetry(() =>
      prisma.certificateRequest.findMany({
        where,
        include: {
          profile: { select: { id: true, fullName: true, email: true } },
          course: { select: { id: true, title: true } },
        },
        orderBy: { requestDate: "desc" },
      }),
    );

    return NextResponse.json({
      data: {
        requests: requests.map((r) => ({
          id: r.id,
          memberName: r.profile.fullName,
          email: r.profile.email,
          courseId: r.courseId,
          courseTitle: r.course?.title ?? null,
          batch: r.batch,
          requestDate: r.requestDate.toISOString(),
          status: r.status,
          notes: r.notes,
        })),
      },
    });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error("[GET /api/admin/certificates/requests]", error);
    return NextResponse.json({ error: "Failed to fetch certificate requests" }, { status: 500 });
  }
}
