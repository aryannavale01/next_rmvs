import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { prisma, withRetry, isTransientPrismaError } from "@/lib/prisma";
import { getSeatAvailability, getSeatAvailabilityBulk } from "@/lib/enrollment/seat-availability";
import { computeHealthIndicator } from "@/lib/enrollment/health-indicator";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courseId = request.nextUrl.searchParams.get("courseId");

  try {
    if (courseId) {
      const course = await withRetry(() =>
        prisma.course.findUnique({
          where: { id: courseId },
          select: { id: true, title: true, category: true, level: true, duration: true, description: true, seatsTotal: true, startDate: true, endDate: true },
        }),
      );
      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }

      const [seatInfo, health, statusCounts, enrollmentStatusCounts, documentStats] = await withRetry(() =>
        Promise.all([
          getSeatAvailability(courseId),
          computeHealthIndicator(courseId),
          prisma.courseApplication.groupBy({
            by: ["status"],
            where: { courseId },
            _count: true,
          }),
          prisma.courseEnrollment.groupBy({
            by: ["status"],
            where: { courseId },
            _count: true,
          }),
          prisma.courseApplication.aggregate({
            where: { courseId, documents: { not: undefined } },
            _count: true,
          }),
        ]),
      );

      const totalApplications = statusCounts.reduce<number>((sum, s) => sum + s._count, 0);
      const conversionRate = totalApplications > 0
        ? Math.round(((statusCounts.find((s) => s.status === "seat_reserved")?._count ?? 0) / totalApplications) * 100)
        : 0;

      return NextResponse.json({
        data: {
          course: {
            id: course.id,
            title: course.title,
            category: course.category,
            level: course.level,
            duration: course.duration,
            description: course.description,
            seatsTotal: course.seatsTotal,
            startDate: course.startDate,
            endDate: course.endDate,
          },
          overview: {
            totalApplications,
            seatInfo: {
              capacity: seatInfo.capacity,
              reserved: seatInfo.reserved,
              enrolled: seatInfo.enrolled,
              available: seatInfo.available,
              waitlistCount: seatInfo.waitlistCount,
            },
            conversionRate,
          },
          statusBreakdown: statusCounts.map((s) => ({
            status: s.status,
            count: s._count,
            percentage: totalApplications > 0 ? Math.round((s._count / totalApplications) * 100) : 0,
          })),
          enrollmentStatusBreakdown: enrollmentStatusCounts.map((s) => ({
            status: s.status,
            count: s._count,
          })),
          health: {
            overall: health.overall,
            score: health.score,
            factors: health.factors,
          },
          documentsUploaded: documentStats._count,
        },
      });
    }

    const courses = await withRetry(() =>
      prisma.course.findMany({
        where: { status: "active" },
        select: { id: true, title: true, category: true, seatsTotal: true },
        orderBy: { createdAt: "desc" },
      }),
    );

    const courseIds = courses.map((c) => c.id);
    const seatMap = await getSeatAvailabilityBulk(courseIds);

    const [globalStatusCounts, totalMembers, totalEnrolled] = await withRetry(() =>
      Promise.all([
        prisma.courseApplication.groupBy({
          by: ["status"],
          _count: true,
        }),
        prisma.profile.count({ where: { role: "member" } }),
        prisma.courseEnrollment.count({
          where: { status: { in: ["enrolled", "in_progress"] } },
        }),
      ]),
    );

    const totalApplications = globalStatusCounts.reduce<number>((sum, s) => sum + s._count, 0);

    const courseData = await Promise.all(
      courses.map(async (course) => {
        const health = await computeHealthIndicator(course.id);
        const seats = seatMap.get(course.id);
        return {
          id: course.id,
          title: course.title,
          category: course.category,
          seats: seats
            ? { capacity: seats.capacity, reserved: seats.reserved, enrolled: seats.enrolled, available: seats.available }
            : null,
          health: { overall: health.overall, score: health.score },
        };
      }),
    );

    return NextResponse.json({
      data: {
        overview: {
          totalCourses: courses.length,
          totalApplications,
          totalEnrolled,
          totalMembers,
          globalStatusBreakdown: globalStatusCounts.map((s) => ({
            status: s.status,
            count: s._count,
          })),
        },
        courses: courseData,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/enrollments/analytics]", error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json(
        { error: "Database temporarily unavailable, please retry." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
