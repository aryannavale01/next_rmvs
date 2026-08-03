import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { prisma, withRetry } from "@/lib/prisma";
import { getServiceRoleClient } from "@/lib/supabase-storage";
import { BUCKETS } from "@/lib/upload-config";
import { buildPdfBlob } from "@/lib/enrollment-export-core";
import type { PersonData, CourseData } from "@/lib/enrollment-export-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOC_TYPE_TO_BUCKET: Record<string, string> = {
  aadhaar: BUCKETS.aadhaar,
  pan: BUCKETS.pan,
  rationCard: BUCKETS.rationCard,
};

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { courseId } = body as { courseId?: string };
    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    // Fetch course
    const course = await withRetry(() =>
      prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true, category: true, level: true, duration: true, description: true, seatsTotal: true, startDate: true, endDate: true },
      }),
    );

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Fetch applications + profiles
    const applications = await withRetry(() =>
      prisma.courseApplication.findMany({
        where: { courseId },
        include: {
          profile: {
            select: {
              id: true, fullName: true, email: true, phone: true, gender: true, dob: true,
              district: true, state: true, aadhaarNumber: true, qualification: true, avatarUrl: true,
            },
          },
        },
        orderBy: { appliedDate: "desc" },
      }),
    );

    const profileIds = applications.map((app) => app.profile.id);

    // Fetch documents and enrollments in parallel
    const [documents, enrollments] = await Promise.all([
      withRetry(() =>
        prisma.beneficiaryDocument.findMany({
          where: { profileId: { in: profileIds } },
          select: { id: true, profileId: true, type: true, label: true, status: true, fileUrl: true },
        }),
      ),
      withRetry(() =>
        prisma.courseEnrollment.findMany({
          where: { profileId: { in: profileIds }, courseId },
          select: { id: true, profileId: true, status: true, batchLabel: true, seatNumber: true, enrollmentDate: true, attendance: true, completionDate: true },
        }),
      ),
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

    // Build person data
    const people: PersonData[] = applications.map((app) => ({
      profile: {
        id: app.profile.id,
        fullName: app.profile.fullName,
        email: app.profile.email,
        phone: app.profile.phone ?? "",
        gender: app.profile.gender,
        dob: app.profile.dob?.toISOString() ?? null,
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

    const courseData: CourseData = {
      id: course.id,
      title: course.title,
      category: course.category,
      level: course.level,
      duration: course.duration,
      description: course.description,
      seatsTotal: course.seatsTotal,
      startDate: course.startDate?.toISOString() ?? null,
      endDate: course.endDate?.toISOString() ?? null,
    };

    // Download document images via service-role client
    const supabase = getServiceRoleClient();

    async function downloadAsDataUri(bucket: string, fileUrl: string): Promise<string | null> {
      try {
        const { data, error } = await supabase.storage.from(bucket).download(fileUrl);
        if (error || !data) return null;
        const buffer = Buffer.from(await data.arrayBuffer());
        const base64 = buffer.toString("base64");
        const mime = data.type || "application/octet-stream";
        return `data:${mime};base64,${base64}`;
      } catch {
        return null;
      }
    }

    // Fetch all document images in parallel
    const docDataUris: Record<string, string | null> = {};
    const docFetchPromises: Promise<void>[] = [];

    for (const p of people) {
      for (const doc of p.documents) {
        if (doc.fileUrl) {
          const bucket = DOC_TYPE_TO_BUCKET[doc.type];
          if (bucket) {
            const promise = downloadAsDataUri(bucket, doc.fileUrl).then((uri) => {
              docDataUris[doc.id] = uri;
            });
            docFetchPromises.push(promise);
          }
        }
      }
    }

    // Fetch avatar images in parallel
    const avatarDataUris: Record<string, string | null> = {};
    const avatarFetchPromises: Promise<void>[] = [];

    for (const p of people) {
      if (p.profile.avatarUrl) {
        const promise = downloadAsDataUri(BUCKETS.profilePhoto, p.profile.avatarUrl).then((uri) => {
          avatarDataUris[p.profile.id] = uri;
        });
        avatarFetchPromises.push(promise);
      }
    }

    await Promise.all([...docFetchPromises, ...avatarFetchPromises]);

    // Build the PDF
    const blob = await buildPdfBlob(people, courseData, docDataUris, avatarDataUris);
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="enrollment-export-${new Date().toISOString().split("T")[0]}.pdf"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[POST /api/admin/enrollments/export-pdf]", error);
    return NextResponse.json({ error: "Failed to generate PDF", details: String(error) }, { status: 500 });
  }
}
