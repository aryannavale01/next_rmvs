import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStepUp, authErrorResponse, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
import { updateTeacherSchema } from '@/lib/validations/admin-teacher';
import { logActivity } from '@/lib/activity-log';
import { getPublicUrl } from '@/lib/supabase-storage';
import { BUCKETS } from '@/lib/upload-config';

export const dynamic = 'force-dynamic';

function mapTeacher(t: any) {
  return {
    id: t.id,
    fullName: t.fullName,
    profilePhoto: t.profilePhoto ? getPublicUrl(BUCKETS.profilePhoto, t.profilePhoto) : null,
    designation: t.designation,
    qualification: t.qualification,
    specializations: t.specializations,
    experienceYears: t.experienceYears,
    email: t.email,
    mobile: t.mobile,
    village: t.village,
    taluka: t.taluka,
    district: t.district,
    state: t.state,
    pincode: t.pincode,
    status: t.status,
    teacherType: t.teacherType,
    joinedDate: t.joinedDate instanceof Date ? t.joinedDate.toISOString().split('T')[0] : String(t.joinedDate),
    lastUpdated: t.lastUpdated instanceof Date ? t.lastUpdated.toISOString() : String(t.lastUpdated),
    aadhaar: t.aadhaar,
    pan: t.pan,
    bankAccount: t.bankAccount,
    totalStudents: t.totalStudents,
    certifications: t.certifications,
    bio: t.bio,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
    documents: t.documents?.map((d: any) => ({
      id: d.id,
      type: d.type,
      label: d.label,
      status: d.status,
      uploadedDate: d.uploadedDate?.toISOString?.() ?? null,
      createdAt: d.createdAt?.toISOString?.() ?? null,
    })) ?? [],
    courses: t.courses?.map((tc: any) => ({
      id: tc.id,
      batch: tc.batch,
      startDate: tc.startDate?.toISOString?.()?.split('T')[0] ?? null,
      endDate: tc.endDate?.toISOString?.()?.split('T')[0] ?? null,
      totalStudents: tc.totalStudents,
      completionRate: tc.completionRate,
      status: tc.status,
      course: tc.course ? { id: tc.course.id, title: tc.course.title } : null,
    })) ?? [],
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  try {
    const { id } = await params;

    const teacher = await withRetry(() =>
      prisma.teacher.findUnique({
        where: { id },
        include: {
          documents: { orderBy: { createdAt: 'desc' } },
          courses: {
            include: { course: { select: { id: true, title: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    );

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    return NextResponse.json(mapTeacher(teacher));
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error('[GET /api/admin/teachers/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to fetch teacher' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const { id } = await params;

    const existing = await withRetry(() => prisma.teacher.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const body = await request.json();
    if (typeof body.mobile === 'string' && body.mobile) {
      body.mobile = body.mobile.replace(/\D/g, '');
      if (body.mobile.length === 12 && body.mobile.startsWith('91')) {
        body.mobile = body.mobile.slice(2);
      }
    }
    const parsed = updateTeacherSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    if (data.email && data.email !== existing.email) {
      const emailTaken = await withRetry(() =>
        prisma.teacher.findFirst({
          where: { email: data.email, id: { not: id } },
        }),
      );
      if (emailTaken) {
        return NextResponse.json(
          { error: 'A teacher with this email already exists' },
          { status: 409 },
        );
      }
    }

    const updated = await withRetry(() =>
      prisma.teacher.update({
        where: { id },
        data: {
          ...(data.fullName !== undefined && { fullName: data.fullName }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.mobile !== undefined && { mobile: data.mobile }),
          ...(data.designation !== undefined && { designation: data.designation }),
          ...(data.qualification !== undefined && { qualification: data.qualification ?? null }),
          ...(data.specializations !== undefined && { specializations: data.specializations ?? [] }),
          ...(data.experienceYears !== undefined && { experienceYears: data.experienceYears ?? null }),
          ...(data.village !== undefined && { village: data.village ?? null }),
          ...(data.taluka !== undefined && { taluka: data.taluka ?? null }),
          ...(data.district !== undefined && { district: data.district ?? null }),
          ...(data.state !== undefined && { state: data.state ?? 'Maharashtra' }),
          ...(data.pincode !== undefined && { pincode: data.pincode ?? null }),
          ...(data.teacherType !== undefined && { teacherType: data.teacherType }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.joinedDate !== undefined && { joinedDate: data.joinedDate }),
          ...(data.bio !== undefined && { bio: data.bio ?? null }),
        },
      }),
    );

    await logActivity({
      entity: 'teacher',
      entityId: id,
      action: 'update',
      description: `Updated teacher ${updated.fullName}`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(mapTeacher(updated));
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error('[PATCH /api/admin/teachers/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to update teacher' },
      { status: 500 },
    );
  }
}
