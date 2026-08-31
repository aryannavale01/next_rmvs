import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { createMemberSchema } from '@/lib/validations/admin-member';
import { logActivity } from '@/lib/activity-log';
import { getPublicUrl } from '@/lib/supabase-storage';
import { BUCKETS } from '@/lib/upload-config';
import { hashPassword } from '@better-auth/utils/password';
import * as crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  search:             z.string().optional(),
  status:             z.enum(['active', 'inactive', 'suspended', 'blocked', 'deleted']).optional(),
  gender:             z.enum(['male', 'female', 'transgender', 'other']).optional(),
  category:           z.enum(['general', 'sc', 'st', 'obc', 'nt', 'sbc', 'ews', 'other']).optional(),
  ageMin:             z.coerce.number().int().min(0).max(150).optional(),
  ageMax:             z.coerce.number().int().min(0).max(150).optional(),
  qualification:      z.string().optional(),
  district:           z.string().optional(),
  assignedVolunteer:  z.string().optional(),
  village:            z.string().optional(),
  enrollmentCourseId: z.string().optional(),
  includeDeleted:     z.coerce.boolean().optional(),
  page:               z.coerce.number().int().min(1).default(1),
  pageSize:           z.coerce.number().int().min(1).max(100).default(20),
  sortBy:             z.enum([
    'fullName', 'age', 'gender', 'category', 'qualification',
    'district', 'state', 'assignedVolunteer', 'createdAt', 'status',
  ]).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

function ageToDate(years: number, end: boolean): Date {
  const now = new Date();
  const d = new Date(now);
  d.setFullYear(d.getFullYear() - years);
  if (!end) d.setHours(0, 0, 0, 0);
  else d.setHours(23, 59, 59, 999);
  return d;
}

function mapProfile(p: any) {
  const dob = p.dob as Date | null;
  const age = dob
    ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  return {
    id: p.id,
    fullName: p.fullName,
    email: p.email,
    phone: p.phone,
    age,
    gender: p.gender,
    category: p.beneficiaryDetail?.category ?? null,
    qualification: p.qualification,
    village: p.beneficiaryAddresses?.[0]?.village ?? null,
    district: p.district,
    state: p.state,
    status: p.status,
    assignedVolunteer: p.assignedVolunteer,
    createdAt: p.registrationDate?.toISOString().split('T')[0] ?? p.createdAt.toISOString().split('T')[0],
    profileImage: p.avatarUrl ? getPublicUrl(BUCKETS.profilePhoto, p.avatarUrl) : null,
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

    const where: Prisma.ProfileWhereInput = {};

    // Always exclude admin profiles from the member list
    where.role = 'member';

    if (q.status) {
      where.status = q.status;
    } else if (!q.includeDeleted) {
      where.status = { not: 'deleted' };
    }

    if (q.gender) where.gender = q.gender;
    if (q.qualification) where.qualification = q.qualification;
    if (q.district) where.district = q.district;
    if (q.assignedVolunteer) where.assignedVolunteer = q.assignedVolunteer;

    if (q.ageMin !== undefined || q.ageMax !== undefined) {
      const dobConditions: any = {};
      if (q.ageMax !== undefined) dobConditions.gte = ageToDate(q.ageMax, true);
      if (q.ageMin !== undefined) dobConditions.lte = ageToDate(q.ageMin, false);
      where.dob = dobConditions;
    }

    if (q.search) {
      where.OR = [
        { fullName: { contains: q.search, mode: 'insensitive' } },
        { email: { contains: q.search, mode: 'insensitive' } },
        { phone: { contains: q.search, mode: 'insensitive' } },
        { assignedVolunteer: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    if (q.category) {
      where.beneficiaryDetail = { category: q.category };
    }

    if (q.village) {
      where.beneficiaryAddresses = {
        some: { village: { contains: q.village, mode: 'insensitive' } },
      };
    }

    if (q.enrollmentCourseId) {
      where.courseEnrollments = {
        some: { courseId: q.enrollmentCourseId },
      };
    }

    let orderBy: any;
    if (q.sortBy === 'age') {
      orderBy = { dob: q.sortOrder === 'asc' ? 'desc' : 'asc' };
    } else if (q.sortBy === 'category') {
      orderBy = { beneficiaryDetail: { category: q.sortOrder } };
    } else {
      orderBy = { [q.sortBy]: q.sortOrder };
    }

    const skip = (q.page - 1) * q.pageSize;

    const [data, total] = await withRetry(() =>
      prisma.$transaction([
        prisma.profile.findMany({
          where,
          include: {
            beneficiaryDetail: {
              select: {
                category: true,
                occupation: true,
                maritalStatus: true,
                annualIncome: true,
              },
            },
            beneficiaryAddresses: {
              select: {
                village: true,
                taluka: true,
                district: true,
                state: true,
                pincode: true,
              },
              take: 1,
            },
          },
          skip,
          take: q.pageSize,
          orderBy,
        }),
        prisma.profile.count({ where }),
      ]),
    );

    const totalPages = Math.ceil(total / q.pageSize);

    return NextResponse.json({
      data: data.map(mapProfile),
      pagination: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('[GET /api/admin/members]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json(
        { error: 'Database temporarily unavailable, please retry.' },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 },
    );
  }
}

function mapProfileDetail(p: any) {
  const dob = p.dob as Date | null;
  const age = dob
    ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  return {
    id: p.id,
    fullName: p.fullName,
    email: p.email,
    phone: p.phone,
    age,
    gender: p.gender,
    dob: dob?.toISOString().split('T')[0] ?? null,
    status: p.status,
    isDeleted: p.status === 'deleted',
    avatarUrl: p.avatarUrl ? getPublicUrl(BUCKETS.profilePhoto, p.avatarUrl) : null,
    photoUrlHQ: p.photoUrlHQ ? getPublicUrl(BUCKETS.profilePhoto, p.photoUrlHQ) : null,
    photoBlurDataUrl: p.photoBlurDataUrl,
    aadhaarNumber: p.aadhaarNumber,
    panNumber: p.panNumber,
    addressLine1: p.addressLine1,
    district: p.district,
    state: p.state,
    pincode: p.pincode,
    qualification: p.qualification,
    emailVerified: p.emailVerified,
    phoneVerified: p.phoneVerified,
    profileCompletion: p.profileCompletion,
    verificationScore: p.verificationScore,
    assignedVolunteer: p.assignedVolunteer,
    fieldOfficer: p.fieldOfficer,
    coordinator: p.coordinator,
    region: p.region,
    registrationDate: p.registrationDate?.toISOString().split('T')[0] ?? null,
    lastLogin: p.lastLogin?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    beneficiaryDetail: p.beneficiaryDetail ?? null,
    beneficiaryAddresses: (p.beneficiaryAddresses ?? []).map((a: any) => ({
      id: a.id,
      village: a.village,
      taluka: a.taluka,
      district: a.district,
      state: a.state,
      pincode: a.pincode,
      assemblyConstituency: a.assemblyConstituency,
      parliamentConstituency: a.parliamentConstituency,
      createdAt: a.createdAt.toISOString(),
    })),
    beneficiaryDocuments: (p.beneficiaryDocuments ?? []).map((d: any) => ({
      id: d.id,
      type: d.type,
      label: d.label,
      fileUrl: d.fileUrl,
      status: d.status,
      uploadedDate: d.uploadedDate?.toISOString() ?? null,
      verifiedDate: d.verifiedDate?.toISOString() ?? null,
      verifiedBy: d.verifiedBy ?? null,
      rejectionReason: d.rejectionReason ?? null,
      createdAt: d.createdAt.toISOString(),
    })),
    courseEnrollments: (p.courseEnrollments ?? []).map((e: any) => ({
      id: e.id,
      course: e.course ? { id: e.course.id, title: e.course.title } : null,
      batch: e.batchLabel,
      trainer: e.trainer,
      enrollmentDate: e.enrollmentDate.toISOString().split('T')[0],
      completionDate: e.completionDate?.toISOString().split('T')[0] ?? null,
      status: e.status,
      attendance: e.attendance,
      assessmentScore: e.assessmentScore,
      documentsVerified: e.documentsVerified,
      adminNotes: e.adminNotes,
    })),
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const body = await request.json();
    if (typeof body.phone === 'string' && body.phone) {
      body.phone = body.phone.replace(/\D/g, '');
      if (body.phone.length === 12 && body.phone.startsWith('91')) {
        body.phone = body.phone.slice(2);
      }
    }
    const parsed = createMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Check email uniqueness
    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
      'SELECT id FROM "User" WHERE email = $1',
      data.email,
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 },
      );
    }

    // Generate cryptographically random temp password
    const rawBytes = crypto.randomBytes(20).toString('base64url');
    const specialChars = '!@#$%^&*';
    const temporaryPassword =
      rawBytes.charAt(0).toUpperCase() +
      rawBytes.slice(1, 10) +
      crypto.randomInt(10).toString() +
      rawBytes.slice(10, 18) +
      specialChars[crypto.randomInt(specialChars.length)] +
      rawBytes.slice(18);

    const hashedPw = await hashPassword(temporaryPassword);
    const userId = crypto.randomBytes(16).toString('hex');
    const now = new Date();

    // Create User, Account, Profile in a single transaction
    const profile = await prisma.$transaction(async (tx) => {
      // 1. Create Better Auth User
      await tx.$executeRawUnsafe(
        'INSERT INTO "User" (id, email, "emailVerified", name, role, "mustChangePassword", "lastLoginAt", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5::"Role", $6, $7, $8, $9)',
        userId,
        data.email,
        true,
        data.fullName,
        'MEMBER',
        true,
        now,
        now,
        now,
      );

      // 2. Create Account with hashed password
      await tx.$executeRawUnsafe(
        'INSERT INTO "Account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
        crypto.randomBytes(16).toString('hex'),
        userId,
        crypto.randomBytes(12).toString('hex'),
        'credential',
        hashedPw,
        now,
        now,
      );

      // 3. Create Profile
      const prof = await tx.profile.create({
        data: {
          id: userId,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone ?? null,
          gender: data.gender ?? null,
          dob: data.dob ?? null,
          role: 'member',
          aadhaarNumber: data.aadhaarNumber?.replace(/-/g, '') ?? null,
          panNumber: data.panNumber?.toUpperCase() ?? null,
          addressLine1: data.addressLine1 ?? null,
          district: data.district ?? null,
          state: data.state ?? null,
          pincode: data.pincode ?? null,
          qualification: data.qualification ?? null,
          status: data.status ?? 'active',
          assignedVolunteer: data.assignedVolunteer ?? null,
          fieldOfficer: data.fieldOfficer ?? null,
          coordinator: data.coordinator ?? null,
          region: data.region ?? null,
        },
      });

      // 4. Create BeneficiaryDetail if provided
      if (data.beneficiaryDetail) {
        await tx.beneficiaryDetail.create({
          data: {
            profileId: userId,
            ...data.beneficiaryDetail,
          },
        });
      }

      // 5. Create BeneficiaryAddresses if provided
      if (data.beneficiaryAddresses && data.beneficiaryAddresses.length > 0) {
        await tx.beneficiaryAddress.createMany({
          data: data.beneficiaryAddresses.map((addr) => ({
            profileId: userId,
            ...addr,
          })),
        });
      }

      return prof;
    });

    // Fetch the complete profile for response
    const completeProfile = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
        beneficiaryDetail: true,
        beneficiaryAddresses: { orderBy: { createdAt: 'desc' } },
        beneficiaryDocuments: { orderBy: { createdAt: 'desc' } },
        courseEnrollments: {
          include: { course: { select: { id: true, title: true } } },
          orderBy: { enrollmentDate: 'desc' },
        },
      },
    });

    // Log the activity
    await logActivity({
      entity: 'member',
      entityId: userId,
      action: 'create',
      description: `Created member ${data.fullName} (${data.email})`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(
      { ...mapProfileDetail(completeProfile), temporaryPassword },
      { status: 201 },
    );
  } catch (error) {
    console.error('[POST /api/admin/members]', error);
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 },
    );
  }
}
