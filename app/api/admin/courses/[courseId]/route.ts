import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireStepUp, stepUpErrorResponse } from "@/lib/session";
import { prisma, withRetry, dbErrorResponse } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import {
  mapCourseToAdminShape,
  buildPrismaUpdateBody,
  slugify,
  mapCouponToAdmin,
} from "@/lib/course-mapping";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = new Set(["Agriculture", "Tech", "Healthcare", "Business"]);
const VALID_MODES = new Set(["Online", "Offline", "Hybrid"]);
const VALID_STATUSES = new Set(["Draft", "Published"]);

function couponCodes(coupons: unknown): string[] {
  if (!Array.isArray(coupons)) return [];
  return coupons
    .map((c: any) => String(c?.code ?? "").trim().toUpperCase())
    .filter(Boolean);
}

function validateFields(body: Record<string, unknown>): string | null {
  if (body.category !== undefined && body.category !== "" && (typeof body.category !== "string" || !VALID_CATEGORIES.has(body.category))) {
    return "Invalid category";
  }
  if (body.mode !== undefined && body.mode !== "" && (typeof body.mode !== "string" || !VALID_MODES.has(body.mode))) {
    return "Invalid mode";
  }
  if (body.status !== undefined && body.status !== "" && (typeof body.status !== "string" || !VALID_STATUSES.has(body.status))) {
    return "Invalid status";
  }
  return null;
}

async function replaceSyllabus(courseId: string, syllabus: any[]) {
  await prisma.courseSyllabus.deleteMany({ where: { courseId } });
  if (Array.isArray(syllabus) && syllabus.length > 0) {
    await prisma.courseSyllabus.createMany({
      data: syllabus.map((s, i) => {
        let durationMinutes: number | null = null;
        const duration = String(s?.duration ?? "").trim().toLowerCase();
        const match = duration.match(/(\d+(?:\.\d+)?)/);
        if (match) {
          const num = Number(match[1]);
          if (!Number.isNaN(num)) {
            durationMinutes = duration.includes("hr") ? Math.round(num * 60) : Math.round(num);
          }
        }
        return {
          courseId,
          title: String(s?.title ?? "").trim(),
          lessonType: ["video", "text", "quiz", "assignment"].includes(s?.type?.toLowerCase())
            ? s.type.toLowerCase()
            : "video",
          durationMinutes,
          sortOrder: i,
          isFreePreview: false,
        };
      }),
    });
  }
}

async function syncCoupons(courseId: string, newCoupons: any[]) {
  if (!Array.isArray(newCoupons)) return;
  const existing = await prisma.coupon.findMany({ where: { courseId } });
  const newCodes = new Set(newCoupons.map((c) => String(c?.code ?? "").trim().toUpperCase()).filter(Boolean));

  // Delete removed coupons that have never been redeemed
  const toDelete = existing.filter((c) => !newCodes.has(c.code) && c.usedCount === 0).map((c) => c.id);
  if (toDelete.length > 0) {
    await prisma.coupon.deleteMany({ where: { id: { in: toDelete } } });
  }

  // Soft-disable removed coupons that have redemption history
  const toDeactivate = existing.filter((c) => !newCodes.has(c.code) && c.usedCount > 0).map((c) => c.id);
  if (toDeactivate.length > 0) {
    await prisma.coupon.updateMany({
      where: { id: { in: toDeactivate } },
      data: { isActive: false },
    });
  }

  // Upsert remaining coupons
  for (const c of newCoupons) {
    const code = String(c?.code ?? "").trim().toUpperCase();
    if (!code) continue;
    const data = {
      description: c?.description || null,
      discountType: (c?.discountType === "fixed" ? "fixed" : "percentage") as "percentage" | "fixed",
      discountValue: Number(c?.discountValue) || 0,
      expiresAt: c?.expiresAt ? new Date(c.expiresAt) : null,
      maxUses: c?.maxUses ?? 10,
      perUserLimit: null,
      isActive: true,
    };
    const existingCoupon = existing.find((e) => e.code === code);
    if (existingCoupon) {
      await prisma.coupon.update({ where: { id: existingCoupon.id }, data });
    } else {
      await prisma.coupon.create({ data: { code, courseId, ...data } });
    }
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const { courseId } = await params;

    const course = await withRetry(() =>
      prisma.course.findUnique({
        where: { id: courseId },
        include: {
          _count: {
            select: {
              applications: { where: { status: { not: "deleted" } } },
              enrollments: { where: { status: { notIn: ["dropped", "completed"] } } },
            },
          },
          syllabus: { orderBy: { sortOrder: "asc" } },
          coupons: true,
        },
      })
    );
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({
      course: mapCourseToAdminShape(course, {
        seatsEnrolled: course._count.enrollments,
        totalApplications: course._count.applications,
      }),
    });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error("[GET /api/admin/courses/[courseId]]", error);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const { courseId } = await params;

    const course = await withRetry(() =>
      prisma.course.findUnique({ where: { id: courseId } })
    );
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const body = await request.json();

    const validationError = validateFields(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const hasSyllabusChange = body.syllabus !== undefined;
    const hasCouponsChange = body.coupons !== undefined;

    // Regenerate slug when the title changes
    let newSlug: string | null = null;
    if (body.title !== undefined && body.title !== course.title) {
      const slug = slugify(body.title as string);
      if (slug !== course.slug) {
        const other = await withRetry(() =>
          prisma.course.findFirst({
            where: { slug, id: { not: courseId } },
          })
        );
        if (other) {
          return NextResponse.json({ error: "A course with this title already exists" }, { status: 409 });
        }
        newSlug = slug;
      }
    }

    // Derive instructor display fields when the teacher changes
    if (body.teacher_id && body.teacher_id !== course.teacherId) {
      const teacher = await withRetry(() =>
        prisma.teacher.findUnique({ where: { id: body.teacher_id as string } })
      );
      if (teacher) {
        body.instructorName = teacher.fullName ?? "";
        body.instructorRole = teacher.designation ?? "";
        body.instructorImage = teacher.profilePhoto ?? "";
      }
    }

    const updateData = buildPrismaUpdateBody(body);

    if (newSlug) updateData.slug = newSlug;

    if (hasCouponsChange) {
      const codes = couponCodes(body.coupons);
      if (codes.length > 0) {
        const existingCoupon = await withRetry(() =>
          prisma.coupon.findFirst({
            where: { code: { in: codes, mode: "insensitive" }, courseId: { not: courseId } },
          })
        );
        if (existingCoupon) {
          return NextResponse.json(
            { error: `Coupon code "${existingCoupon.code}" is already in use on another course` },
            { status: 409 },
          );
        }
      }
    }

    if (Object.keys(updateData).length === 0 && !hasSyllabusChange && !hasCouponsChange) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Seat capacity guard: prevent reducing capacity below currently filled seats
    if (updateData.seatsTotal !== undefined && typeof updateData.seatsTotal === "number") {
      const newSeats = updateData.seatsTotal;
      const existingReserved = await withRetry(() =>
        prisma.courseApplication.count({
          where: { courseId, status: "seat_reserved" },
        })
      );
      const existingEnrolled = await withRetry(() =>
        prisma.courseEnrollment.count({
          where: { courseId, status: { notIn: ["dropped", "completed"] } },
        })
      );
      const filledSeats = existingReserved + existingEnrolled;
      if (newSeats < filledSeats) {
        return NextResponse.json({
          error: `Can't reduce capacity below ${filledSeats} currently filled seats (${existingReserved} reserved + ${existingEnrolled} enrolled)`,
        }, { status: 409 });
      }
    }

    if (Object.keys(updateData).length > 0) {
      await withRetry(() =>
        prisma.course.update({
          where: { id: courseId },
          data: updateData as any,
        })
      );
    }

    if (hasSyllabusChange) {
      await withRetry(() => replaceSyllabus(courseId, body.syllabus as any[]));
    }
    if (hasCouponsChange) {
      await withRetry(() => syncCoupons(courseId, body.coupons as any[]));
    }

    await logActivity({
      entity: "course",
      entityId: courseId,
      action: "update",
      description: `Updated course settings: ${Object.keys(updateData).join(", ") || "syllabus/coupons"}`,
      performedBy: auth.session.user.id,
    });

    const updated = await withRetry(() =>
      prisma.course.findUnique({
        where: { id: courseId },
        include: { syllabus: { orderBy: { sortOrder: "asc" } }, coupons: true },
      })
    );

    return NextResponse.json({
      message: "Course updated",
      course: updated ? mapCourseToAdminShape(updated) : mapCourseToAdminShape(course),
      coupons: hasCouponsChange ? updated?.coupons.map(mapCouponToAdmin) ?? [] : undefined,
    });
  } catch (error: any) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "A course or coupon with this title/code already exists" }, { status: 409 });
    }
    console.error("[PATCH /api/admin/courses/[courseId]]", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const { courseId } = await params;

    const course = await withRetry(() =>
      prisma.course.findUnique({ where: { id: courseId } })
    );
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Soft delete: archive the course rather than hard-deleting
    await withRetry(() =>
      prisma.course.update({
        where: { id: courseId },
        data: { status: "archived" },
      })
    );

    await logActivity({
      entity: "course",
      entityId: courseId,
      action: "delete",
      description: `Deleted course "${course.title}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({ message: "Course deleted" });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error("[DELETE /api/admin/courses/[courseId]]", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
