import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse } from "@/lib/session";
import { prisma, withRetry, dbErrorResponse } from "@/lib/prisma";
import { EnrollmentExportSchema } from "@/lib/validations/admin-enrollment";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = EnrollmentExportSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const q = parsed.data;

  try {
    const response = await withRetry(async () => {
    const where: Record<string, unknown> = {};
    if (q.courseId) where.courseId = q.courseId;
    if (q.status) where.status = q.status;
    if (q.dateFrom || q.dateTo) {
      where.appliedDate = {};
      if (q.dateFrom) (where.appliedDate as Record<string, unknown>).gte = new Date(q.dateFrom);
      if (q.dateTo) (where.appliedDate as Record<string, unknown>).lte = new Date(q.dateTo);
    }

    // For json-rich, include enrollment + document data
    if (q.format === "json-rich") {
      const applications = await prisma.courseApplication.findMany({
        where,
        include: {
          profile: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              gender: true,
              dob: true,
              district: true,
              state: true,
              aadhaarNumber: true,
              qualification: true,
              avatarUrl: true,
            },
          },
          course: {
            select: { id: true, title: true, category: true, level: true, duration: true, description: true, seatsTotal: true, startDate: true, endDate: true },
          },
        },
        orderBy: { appliedDate: "desc" },
        take: 1000,
      });

      // Collect profile IDs for document + enrollment lookup
      const profileIds = applications.map((app) => app.profile.id);
      const courseIdStr = q.courseId;

      const [documents, enrollments] = await Promise.all([
        prisma.beneficiaryDocument.findMany({
          where: { profileId: { in: profileIds } },
          select: { id: true, profileId: true, type: true, label: true, status: true, fileUrl: true },
        }),
        courseIdStr
          ? prisma.courseEnrollment.findMany({
              where: { profileId: { in: profileIds }, courseId: courseIdStr },
              select: { id: true, profileId: true, status: true, batchLabel: true, seatNumber: true, enrollmentDate: true, attendance: true, completionDate: true },
            })
          : Promise.resolve([]),
      ]);

      const docMap = new Map<string, (typeof documents[0])[]>();
      for (const doc of documents) {
        const existing = docMap.get(doc.profileId) ?? [];
        existing.push(doc);
        docMap.set(doc.profileId, existing);
      }

      const enrollMap = new Map<string, (typeof enrollments[0])[]>();
      for (const enr of enrollments) {
        const existing = enrollMap.get(enr.profileId) ?? [];
        existing.push(enr);
        enrollMap.set(enr.profileId, existing);
      }

      const people = applications.map((app) => ({
        profile: {
          id: app.profile.id,
          fullName: app.profile.fullName,
          email: app.profile.email,
          phone: app.profile.phone,
          gender: app.profile.gender,
          dob: app.profile.dob,
          district: app.profile.district,
          state: app.profile.state,
          qualification: app.profile.qualification,
          aadhaarNumber: app.profile.aadhaarNumber,
          avatarUrl: app.profile.avatarUrl,
        },
        application: {
          id: app.id,
          status: app.status,
          appliedDate: app.appliedDate.toISOString(),
          seatReservedAt: app.seatReservedAt?.toISOString() ?? null,
          waitlistedAt: app.waitlistedAt?.toISOString() ?? null,
          convertedAt: app.convertedAt?.toISOString() ?? null,
        },
        enrollments: (enrollMap.get(app.profile.id) ?? []).map((e) => ({
          id: e.id,
          status: e.status,
          batchLabel: e.batchLabel,
          seatNumber: e.seatNumber,
          enrollmentDate: e.enrollmentDate?.toISOString() ?? null,
          attendance: e.attendance,
          completionDate: e.completionDate?.toISOString() ?? null,
        })),
        documents: docMap.get(app.profile.id) ?? [],
      }));

      const course = applications[0]?.course ?? null;

      const metadata = {
        generatedBy: auth.session.user.name ?? auth.session.user.id,
        role: "admin",
        generatedAt: new Date().toISOString(),
        version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0",
        totalRecords: people.length,
        filters: {
          courseId: q.courseId ?? "all",
          status: q.status ?? "all",
        },
      };

      return NextResponse.json({ course, people, metadata });
    }

    // Original format: basic export (json or csv)
    const applications = await prisma.courseApplication.findMany({
      where,
      include: {
        profile: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            district: true,
            state: true,
            aadhaarNumber: true,
            qualification: true,
          },
        },
        course: {
          select: { title: true, category: true, duration: true },
        },
      },
      orderBy: { appliedDate: "desc" },
      take: 1000,
    });

    const exportData = applications.map((app) => ({
      applicationId: app.id,
      memberName: app.profile.fullName,
      email: app.profile.email,
      phone: app.profile.phone,
      district: app.profile.district,
      state: app.profile.state,
      qualification: app.profile.qualification,
      courseTitle: app.course.title,
      courseCategory: app.course.category,
      courseDuration: app.course.duration,
      status: app.status,
      appliedDate: app.appliedDate.toISOString().split("T")[0],
      seatReservedAt: app.seatReservedAt?.toISOString().split("T")[0] ?? "",
      waitlistedAt: app.waitlistedAt?.toISOString().split("T")[0] ?? "",
      convertedAt: app.convertedAt?.toISOString().split("T")[0] ?? "",
      reviewNotes: app.reviewNotes ?? "",
      rejectionReason: app.rejectionReason ?? "",
      paymentStatus: app.paymentStatus,
      amountPaid: app.amountPaid?.toString() ?? "0",
    }));

    const metadata = {
      generatedBy: auth.session.user.name ?? auth.session.user.id,
      role: "admin",
      generatedAt: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0",
      totalRecords: exportData.length,
      filters: {
        courseId: q.courseId ?? "all",
        status: q.status ?? "all",
        dateFrom: q.dateFrom ?? "none",
        dateTo: q.dateTo ?? "none",
      },
    };

    if (q.format === "csv") {
      if (exportData.length === 0) {
        return new NextResponse("No data to export", { status: 404 });
      }

      const headers = Object.keys(exportData[0]);
      const csvRows = [
        headers.join(","),
        ...exportData.map((row) =>
          headers
            .map((h) => {
              const val = String(row[h as keyof typeof row] ?? "");
              return val.includes(",") || val.includes('"') || val.includes("\n")
                ? `"${val.replace(/"/g, '""')}"`
                : val;
            })
            .join(","),
        ),
      ];

      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="enrollment-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ data: exportData, metadata });
    });

    return response;
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error("[GET /api/admin/enrollments/export]", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
