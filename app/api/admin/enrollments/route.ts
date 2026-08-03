import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { prisma, withRetry, isTransientPrismaError } from "@/lib/prisma";
import { EnrollmentFiltersSchema } from "@/lib/validations/admin-enrollment";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = EnrollmentFiltersSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const q = parsed.data;

  try {
    const where: Record<string, unknown> = {};

    if (q.courseId) where.courseId = q.courseId;
    if (q.status) {
      where.status = q.status;
    } else {
      where.status = { not: "deleted" };
    }

    if (q.search) {
      where.OR = [
        { profile: { fullName: { contains: q.search, mode: "insensitive" } } },
        { profile: { email: { contains: q.search, mode: "insensitive" } } },
        { course: { title: { contains: q.search, mode: "insensitive" } } },
      ];
    }

    if (q.dateFrom || q.dateTo) {
      where.appliedDate = {};
      if (q.dateFrom) (where.appliedDate as Record<string, unknown>).gte = new Date(q.dateFrom);
      if (q.dateTo) (where.appliedDate as Record<string, unknown>).lte = new Date(q.dateTo);
    }

    const [applications, total] = await withRetry(() =>
      Promise.all([
        prisma.courseApplication.findMany({
          where,
          include: {
            profile: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                district: true,
                aadhaarNumber: true,
              },
            },
            course: {
              select: {
                id: true,
                title: true,
                category: true,
                seatsTotal: true,
              },
            },
            adminNotes: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { text: true, createdAt: true },
            },
            _count: { select: { adminNotes: true } },
          },
          orderBy: q.sort === "waitlistedAt"
            ? { waitlistedAt: { sort: q.order, nulls: "last" } }
            : { [q.sort]: q.order },
          skip: (q.page - 1) * q.limit,
          take: q.limit,
        }),
        prisma.courseApplication.count({ where }),
      ]),
    );

    const data = applications.map((app) => ({
      id: app.id,
      status: app.status,
      appliedDate: app.appliedDate.toISOString().split("T")[0],
      seatReservedAt: app.seatReservedAt?.toISOString().split("T")[0] ?? null,
      waitlistedAt: app.waitlistedAt?.toISOString().split("T")[0] ?? null,
      convertedAt: app.convertedAt?.toISOString().split("T")[0] ?? null,
      reviewedAt: app.reviewedAt?.toISOString().split("T")[0] ?? null,
      reviewNotes: app.reviewNotes,
      hasTestimonial: app.hasTestimonial,
      member: {
        id: app.profile.id,
        name: app.profile.fullName,
        email: app.profile.email,
        phone: app.profile.phone,
        district: app.profile.district,
      },
      course: {
        id: app.course.id,
        title: app.course.title,
        category: app.course.category,
        seatsTotal: app.course.seatsTotal,
      },
      latestNote: app.adminNotes[0] ?? null,
      noteCount: app._count.adminNotes,
    }));

    return NextResponse.json({
      data,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/enrollments]", error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json(
        { error: "Database temporarily unavailable, please retry." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 });
  }
}
