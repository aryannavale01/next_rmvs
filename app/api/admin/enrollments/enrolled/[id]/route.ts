import { NextRequest, NextResponse } from "next/server";
import { requireStepUp, stepUpErrorResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PatchEnrollmentSchema } from "@/lib/validations/admin-enrollment";
import { logActivity } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = PatchEnrollmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;

  try {
    const existing = await prisma.courseEnrollment.findUnique({
      where: { id },
      select: { id: true, status: true, profileId: true, courseId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    const now = new Date();
    const updates: Record<string, unknown> = {};

    if (data.status) {
      if (data.status === "dropped") {
        updates.status = "dropped";
        updates.droppedAt = now;
      } else if (data.status === "completed") {
        updates.status = "completed";
        updates.completionDate = now;
      }
    }

    if (data.batchLabel !== undefined) {
      updates.batchLabel = data.batchLabel;
    }
    if (data.seatNumber !== undefined) {
      updates.seatNumber = data.seatNumber;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await prisma.courseEnrollment.update({ where: { id }, data: updates });

    await logActivity({
      performedBy: auth.session.user.id,
      action: "status_change",
      entity: "enrollment",
      entityId: id,
      description: `Enrollment ${data.status ? `status changed from ${existing.status} to ${data.status}` : "updated"}${data.batchLabel !== undefined || data.seatNumber !== undefined ? ` (batch/seat updated)` : ""}`,
    });

    const updated = await prisma.courseEnrollment.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        enrollmentDate: true,
        attendance: true,
        batchLabel: true,
        seatNumber: true,
        startedAt: true,
        completionDate: true,
        droppedAt: true,
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
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PATCH /api/admin/enrollments/enrolled/[id]]", error);
    return NextResponse.json({ error: "Failed to update enrollment" }, { status: 500 });
  }
}
