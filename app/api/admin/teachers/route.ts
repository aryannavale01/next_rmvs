import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { createTeacherSchema } from '@/lib/validations/admin-teacher';
import { logActivity } from '@/lib/activity-log';
import { getPublicUrl } from '@/lib/supabase-storage';
import { BUCKETS } from '@/lib/upload-config';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  search:         z.string().optional(),
  status:         z.enum(['active', 'inactive', 'on_leave', 'resigned', 'deleted']).optional(),
  teacherType:    z.enum(['trainer', 'volunteer', 'guest_faculty']).optional(),
  includeDeleted: z.coerce.boolean().optional(),
  page:           z.coerce.number().int().min(1).default(1),
  pageSize:       z.coerce.number().int().min(1).max(100).default(20),
  sortBy:         z.enum([
    'fullName', 'designation', 'district', 'status', 'teacherType',
    'joinedDate', 'experienceYears', 'createdAt',
  ]).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

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
    joinedDate: t.joinedDate.toISOString().split('T')[0],
    lastUpdated: t.lastUpdated.toISOString(),
    aadhaar: t.aadhaar,
    pan: t.pan,
    bankAccount: t.bankAccount,
    totalStudents: t.totalStudents,
    certifications: t.certifications,
    bio: t.bio,
    createdAt: t.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = QuerySchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const q = parsed.data;

    const where: any = {};

    if (q.status) {
      where.status = q.status;
    } else if (!q.includeDeleted) {
      where.status = { not: 'deleted' };
    }

    if (q.teacherType) where.teacherType = q.teacherType;

    if (q.search) {
      where.OR = [
        { fullName: { contains: q.search, mode: 'insensitive' } },
        { email: { contains: q.search, mode: 'insensitive' } },
        { mobile: { contains: q.search, mode: 'insensitive' } },
        { district: { contains: q.search, mode: 'insensitive' } },
        { designation: { contains: q.search, mode: 'insensitive' } },
        { specializations: { has: q.search } },
      ];
    }

    const skip = (q.page - 1) * q.pageSize;

    const [data, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        orderBy: { [q.sortBy]: q.sortOrder },
        skip,
        take: q.pageSize,
      }),
      prisma.teacher.count({ where }),
    ]);

    return NextResponse.json({
      data: data.map(mapTeacher),
      pagination: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.ceil(total / q.pageSize),
      },
    });
  } catch (error) {
    console.error('[GET /api/admin/teachers]', error);
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (typeof body.mobile === 'string' && body.mobile) {
      body.mobile = body.mobile.replace(/\D/g, '');
      if (body.mobile.length === 12 && body.mobile.startsWith('91')) {
        body.mobile = body.mobile.slice(2);
      }
    }
    const parsed = createTeacherSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const existing = await prisma.teacher.findFirst({
      where: { email: data.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'A teacher with this email already exists' },
        { status: 409 },
      );
    }

    const teacher = await prisma.teacher.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        mobile: data.mobile,
        designation: data.designation,
        qualification: data.qualification ?? null,
        specializations: data.specializations ?? [],
        experienceYears: data.experienceYears ?? null,
        village: data.village ?? null,
        taluka: data.taluka ?? null,
        district: data.district ?? null,
        state: data.state ?? 'Maharashtra',
        pincode: data.pincode ?? null,
        teacherType: data.teacherType ?? 'trainer',
        status: data.status ?? 'active',
        joinedDate: data.joinedDate,
        bio: data.bio ?? null,
      },
    });

    await logActivity({
      entity: 'teacher',
      entityId: teacher.id,
      action: 'create',
      description: `Created teacher ${teacher.fullName} (${teacher.email})`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(mapTeacher(teacher), { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/teachers]', error);
    return NextResponse.json(
      { error: 'Failed to create teacher' },
      { status: 500 },
    );
  }
}
