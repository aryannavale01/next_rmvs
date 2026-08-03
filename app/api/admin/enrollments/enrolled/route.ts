import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { prisma, withRetry, isTransientPrismaError } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courseId = request.nextUrl.searchParams.get("courseId");
  const search = request.nextUrl.searchParams.get("search") || "";
  const status = request.nextUrl.searchParams.get("status") || "";
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "20")));

  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }

  try {
    const where: Record<string, unknown> = { courseId };
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { profile: { fullName: { contains: search, mode: "insensitive" } } },
        { profile: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [enrollments, total] = await withRetry(() =>
      Promise.all([
        prisma.courseEnrollment.findMany({
          where,
          include: {
            profile: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                district: true,
              },
            },
          },
          orderBy: { enrollmentDate: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.courseEnrollment.count({ where }),
      ]),
    );

    const data = enrollments.map((e) => ({
      id: e.id,
      status: e.status,
      enrollmentDate: e.enrollmentDate.toISOString().split("T")[0],
      attendance: e.attendance,
      batchLabel: e.batchLabel,
      seatNumber: e.seatNumber,
      startedAt: e.startedAt?.toISOString().split("T")[0] ?? null,
      completionDate: e.completionDate?.toISOString().split("T")[0] ?? null,
      member: {
        id: e.profile.id,
        name: e.profile.fullName,
        email: e.profile.email,
        phone: e.profile.phone,
        district: e.profile.district,
      },
    }));

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/enrollments/enrolled]", error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json(
        { error: "Database temporarily unavailable, please retry." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 });
  }
}
