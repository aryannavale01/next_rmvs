import { NextRequest, NextResponse } from "next/server";
import { requireStepUp, stepUpErrorResponse } from "@/lib/session";
import { prisma, withRetry, dbErrorResponse } from "@/lib/prisma";
import { BulkActionSchema } from "@/lib/validations/admin-enrollment";
import { getSeatAvailability } from "@/lib/enrollment/seat-availability";
import { logActivity } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  const body = await request.json();
  const parsed = BulkActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { action, applicationIds = [], enrollmentIds = [] } = parsed.data;

  // Bulk actions are idempotent (each item is checked against its current
  // status and skipped if already in the target state), so a transient DB
  // failure can safely retry the whole operation.
  try {
    const response = await withRetry(async () => {
    const applications = await prisma.courseApplication.findMany({
      where: { id: { in: applicationIds } },
      include: {
        course: { select: { id: true, title: true, seatsTotal: true } },
        profile: { select: { fullName: true, email: true } },
      },
    });

    if (applications.length === 0) {
      return NextResponse.json({ error: "No applications found" }, { status: 404 });
    }

    const results: { applicationId: string; status: "success" | "skipped"; reason: string }[] = [];

    if (action === "approve" || action === "waitlist" || action === "reject") {
      for (const app of applications) {
        const targetStatus = action === "approve" ? "seat_reserved" : action === "waitlist" ? "waitlisted" : "rejected";

        if (app.status === targetStatus) {
          results.push({ applicationId: app.id, status: "skipped", reason: `Already ${targetStatus}` });
          continue;
        }

        if (action === "approve") {
          const seatInfo = await getSeatAvailability(app.courseId);
          if (seatInfo.available <= 0) {
            await prisma.courseApplication.update({
              where: { id: app.id },
              data: { status: "waitlisted", waitlistedAt: new Date() },
            });
            results.push({ applicationId: app.id, status: "skipped", reason: "No seats available — moved to waitlist" });
            continue;
          }
        }

        const now = new Date();
        const updates: Record<string, unknown> = { status: targetStatus };
        if (action === "approve") {
          updates.seatReservedAt = now;
          updates.convertedAt = now;
          updates.approvedById = auth.session.user.id;
          updates.reviewedAt = now;
        } else if (action === "waitlist") {
          updates.waitlistedAt = now;
        } else if (action === "reject") {
          updates.rejectionReason = "Bulk rejection";
          updates.reviewedAt = now;
        }

        if (action === "approve") {
          const existingEnrollment = await prisma.courseEnrollment.findFirst({
            where: { profileId: app.profileId, courseId: app.courseId },
          });

          if (!existingEnrollment) {
            await prisma.$transaction([
              prisma.courseApplication.update({ where: { id: app.id }, data: updates }),
              prisma.courseEnrollment.create({
                data: {
                  profileId: app.profileId,
                  courseId: app.courseId,
                  status: "enrolled",
                  enrollmentDate: now,
                },
              }),
            ]);
          } else {
            await prisma.courseApplication.update({ where: { id: app.id }, data: updates });
          }
        } else {
          await prisma.courseApplication.update({ where: { id: app.id }, data: updates });
        }

        results.push({ applicationId: app.id, status: "success", reason: `Moved to ${targetStatus}` });
      }
    } else if (action === "convert") {
      for (const app of applications) {
        if (app.status !== "seat_reserved") {
          results.push({ applicationId: app.id, status: "skipped", reason: "Not in seat_reserved status" });
          continue;
        }

        const existingEnrollment = await prisma.courseEnrollment.findFirst({
          where: { profileId: app.profileId, courseId: app.courseId },
        });
        if (existingEnrollment) {
          results.push({ applicationId: app.id, status: "skipped", reason: "Already enrolled" });
          continue;
        }

        await prisma.courseEnrollment.create({
          data: {
            profileId: app.profileId,
            courseId: app.courseId,
            status: "enrolled",
            enrollmentDate: new Date(),
            documentsVerified: true,
          },
        });

        await prisma.courseApplication.update({
          where: { id: app.id },
          data: { convertedAt: new Date() },
        });

        results.push({ applicationId: app.id, status: "success", reason: "Converted to enrollment" });
      }
    } else if (action === "promote" || action === "move_to_review" || action === "remove") {
      for (const app of applications) {
        if (action === "promote") {
          const seatInfo = await getSeatAvailability(app.courseId);
          if (seatInfo.available <= 0) {
            results.push({ applicationId: app.id, status: "skipped", reason: "No seats available" });
            continue;
          }
          if (app.status !== "waitlisted") {
            results.push({ applicationId: app.id, status: "skipped", reason: `Status is "${app.status}", not waitlisted` });
            continue;
          }
          const now = new Date();
          const existingEnrollment = await prisma.courseEnrollment.findFirst({
            where: { profileId: app.profileId, courseId: app.courseId },
          });
          if (!existingEnrollment) {
            await prisma.$transaction([
              prisma.courseApplication.update({
                where: { id: app.id },
                data: { status: "seat_reserved", seatReservedAt: now, convertedAt: now, approvedById: auth.session.user.id, reviewedAt: now },
              }),
              prisma.courseEnrollment.create({
                data: { profileId: app.profileId, courseId: app.courseId, status: "enrolled", enrollmentDate: now },
              }),
            ]);
          } else {
            await prisma.courseApplication.update({
              where: { id: app.id },
              data: { status: "seat_reserved", seatReservedAt: now, convertedAt: now, approvedById: auth.session.user.id, reviewedAt: now },
            });
          }
          results.push({ applicationId: app.id, status: "success", reason: "Promoted to seat_reserved" });
        } else if (action === "move_to_review") {
          if (app.status !== "waitlisted") {
            results.push({ applicationId: app.id, status: "skipped", reason: `Status is "${app.status}", not waitlisted` });
            continue;
          }
          await prisma.courseApplication.update({
            where: { id: app.id },
            data: { status: "under_review", waitlistedAt: null },
          });
          results.push({ applicationId: app.id, status: "success", reason: "Moved to review" });
        } else if (action === "remove") {
          if (app.status === "deleted") {
            results.push({ applicationId: app.id, status: "skipped", reason: "Already removed" });
            continue;
          }
          await prisma.courseApplication.update({
            where: { id: app.id },
            data: { status: "deleted" },
          });
          results.push({ applicationId: app.id, status: "success", reason: "Removed" });
        }
      }
    }

    // Enrollment-based bulk actions
    if ((action === "bulk_drop" || action === "bulk_complete") && enrollmentIds.length > 0) {
      const enrollments = await prisma.courseEnrollment.findMany({
        where: { id: { in: enrollmentIds } },
        include: { profile: { select: { fullName: true } } },
      });

      for (const enr of enrollments) {
        if (action === "bulk_drop") {
          if (enr.status === "dropped") {
            results.push({ applicationId: enr.id, status: "skipped", reason: "Already dropped" });
            continue;
          }
          await prisma.courseEnrollment.update({
            where: { id: enr.id },
            data: { status: "dropped", droppedAt: new Date() },
          });
          results.push({ applicationId: enr.id, status: "success", reason: "Dropped" });
        } else if (action === "bulk_complete") {
          if (enr.status === "completed" || enr.status === "certified") {
            results.push({ applicationId: enr.id, status: "skipped", reason: `Already ${enr.status}` });
            continue;
          }
          await prisma.courseEnrollment.update({
            where: { id: enr.id },
            data: { status: "completed" },
          });
          results.push({ applicationId: enr.id, status: "success", reason: "Marked completed" });
        }
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const skippedCount = results.filter((r) => r.status === "skipped").length;
    const totalProcessed = applicationIds.length + enrollmentIds.length;

    await logActivity({
      performedBy: auth.session.user.id,
      action: "status_change",
      entity: "enrollment",
      entityId: applicationIds[0] ?? enrollmentIds[0],
      description: `Bulk ${action} on ${totalProcessed} items: ${successCount} succeeded, ${skippedCount} skipped`,
    });

    return NextResponse.json({
      data: {
        action,
        total: totalProcessed,
        successCount,
        skippedCount,
        results,
      },
    });
    });

    return response;
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error("[POST /api/admin/enrollments/bulk]", error);
    return NextResponse.json({ error: "Failed to execute bulk action" }, { status: 500 });
  }
}
