import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { prisma, withRetry, isTransientPrismaError } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const COMPLETED_STATUSES = ["completed", "certified"];
const ELIGIBLE_ENROLLMENT_STATUSES = ["completed", "certified"];

function summarizeCertificates(certs: { courseId: string | null; profileId: string; status: string }[], courseId: string) {
  const courseCerts = certs.filter((c) => c.courseId === courseId);
  return {
    generated: courseCerts.length,
    approved: courseCerts.filter((c) => c.status === "approved").length,
    pending: courseCerts.filter((c) => c.status === "pending").length,
    revoked: courseCerts.filter((c) => c.status === "revoked").length,
  };
}

function summarizeEnrollments(enrollments: { courseId: string; profileId: string; status: string }[], certs: { courseId: string | null; profileId: string; status: string }[], courseId: string) {
  const courseEnrollments = enrollments.filter((e) => e.courseId === courseId);
  const nonRevoked = new Set(
    certs
      .filter((c) => c.courseId === courseId && c.status !== "revoked")
      .map((c) => c.profileId),
  );
  return {
    enrolled: courseEnrollments.filter((e) => e.status !== "dropped").length,
    completed: courseEnrollments.filter((e) => COMPLETED_STATUSES.includes(e.status)).length,
    eligible: courseEnrollments.filter(
      (e) => ELIGIBLE_ENROLLMENT_STATUSES.includes(e.status) && !nonRevoked.has(e.profileId),
    ).length,
  };
}

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
          select: {
            id: true,
            title: true,
            category: true,
            level: true,
            duration: true,
            description: true,
            seatsTotal: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        }),
      );
      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }

      const [enrollments, certificates, requests] = await withRetry(() =>
        Promise.all([
          prisma.courseEnrollment.findMany({
            where: { courseId },
            include: {
              profile: { select: { id: true, fullName: true, email: true, phone: true, district: true } },
            },
            orderBy: { enrollmentDate: "desc" },
          }),
          prisma.certificate.findMany({
            where: { courseId },
            orderBy: { generationDate: "desc" },
          }),
          prisma.certificateRequest.findMany({
            where: { courseId },
            include: { profile: { select: { id: true, fullName: true, email: true } } },
            orderBy: { requestDate: "desc" },
          }),
        ]),
      );

      const certsByProfile = new Map<string, { id: string; certificateNumber: string; status: string }>();
      for (const c of certificates) {
        if (c.status !== "revoked" && !certsByProfile.has(c.profileId)) {
          certsByProfile.set(c.profileId, { id: c.id, certificateNumber: c.certificateNumber, status: c.status });
        }
      }

      const enrollmentRows = enrollments.map((e) => ({
        id: e.id,
        member: {
          id: e.profile.id,
          name: e.profile.fullName,
          email: e.profile.email,
          phone: e.profile.phone,
          district: e.profile.district,
        },
        status: e.status,
        batchLabel: e.batchLabel,
        completionDate: e.completionDate?.toISOString() ?? null,
        certificateGenerated: e.certificateGenerated,
        certificate: certsByProfile.get(e.profileId) ?? null,
      }));

      const certRows = certificates.map((c) => ({
        id: c.id,
        certificateNumber: c.certificateNumber,
        memberName: enrollments.find((e) => e.profileId === c.profileId)?.profile.fullName ?? null,
        status: c.status,
        publishedStatus: c.publishedStatus,
        issueDate: c.issueDate?.toISOString() ?? null,
        generationDate: c.generationDate?.toISOString() ?? null,
        completionDate: c.completionDate?.toISOString() ?? null,
        batch: c.batch,
        teacherName: c.teacherName,
        verificationUrl: c.verificationUrl,
      }));

      const certSummary = summarizeCertificates(certificates, courseId);
      const enrollSummary = summarizeEnrollments(enrollments, certificates, courseId);

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
            status: course.status,
          },
          overview: {
            ...enrollSummary,
            ...certSummary,
            pendingRequests: requests.filter((r) => r.status === "pending").length,
          },
          enrollments: enrollmentRows,
          certificates: certRows,
          requests: requests.map((r) => ({
            id: r.id,
            memberName: r.profile.fullName,
            email: r.profile.email,
            requestDate: r.requestDate.toISOString(),
            status: r.status,
            notes: r.notes,
            batch: r.batch,
          })),
        },
      });
    }

    const [courses, enrollments, certificates, requests] = await withRetry(() =>
      Promise.all([
        prisma.course.findMany({
          where: { status: "active" },
          select: { id: true, title: true, category: true, level: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.courseEnrollment.findMany({
          select: { courseId: true, profileId: true, status: true },
        }),
        prisma.certificate.findMany({
          select: { courseId: true, profileId: true, status: true },
        }),
        prisma.certificateRequest.count({ where: { status: "pending" } }),
      ]),
    );

    const courseData = courses.map((course) => ({
      id: course.id,
      title: course.title,
      category: course.category,
      level: course.level,
      certs: {
        ...summarizeEnrollments(enrollments, certificates, course.id),
        ...summarizeCertificates(certificates, course.id),
      },
    }));

    const total = {
      enrolled: 0,
      completed: 0,
      eligible: 0,
      generated: 0,
      approved: 0,
      pending: 0,
    };
    for (const c of courseData) {
      total.enrolled += c.certs.enrolled;
      total.completed += c.certs.completed;
      total.eligible += c.certs.eligible;
      total.generated += c.certs.generated;
      total.approved += c.certs.approved;
      total.pending += c.certs.pending;
    }

    return NextResponse.json({
      data: {
        overview: {
          totalCourses: courses.length,
          totalEnrolled: total.enrolled,
          totalCompleted: total.completed,
          totalEligible: total.eligible,
          totalGenerated: total.generated,
          totalApproved: total.approved,
          totalPending: total.pending,
          pendingRequests: requests,
        },
        courses: courseData,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/certificates]", error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json(
        { error: "Database temporarily unavailable, please retry." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}
