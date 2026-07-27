import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { updateMemberSchema } from '@/lib/validations/admin-member';
import { logActivity } from '@/lib/activity-log';
import { getPublicUrl } from '@/lib/supabase-storage';
import { BUCKETS } from '@/lib/upload-config';

export const dynamic = 'force-dynamic';

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
    adminNotes: p.adminNotes ?? null,
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
      batch: e.batch,
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const profile = await prisma.profile.findUnique({
      where: { id },
      include: {
        beneficiaryDetail: true,
        beneficiaryAddresses: {
          orderBy: { createdAt: 'desc' },
        },
        beneficiaryDocuments: {
          orderBy: { createdAt: 'desc' },
        },
        courseEnrollments: {
          include: {
            course: {
              select: { id: true, title: true },
            },
          },
          orderBy: { enrollmentDate: 'desc' },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 },
      );
    }

    const result = mapProfileDetail(profile);

    const verifiedByIds = [...new Set(
      (profile.beneficiaryDocuments ?? [])
        .map((d: any) => d.verifiedBy)
        .filter((id): id is string => Boolean(id)),
    )];

    if (verifiedByIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: verifiedByIds } },
        select: { id: true, name: true, email: true },
      });
      const nameMap = new Map(users.map(u => [u.id, u.name ?? u.email]));
      result.beneficiaryDocuments = result.beneficiaryDocuments.map((d: any) => ({
        ...d,
        verifiedByName: d.verifiedBy ? (nameMap.get(d.verifiedBy) ?? null) : null,
      }));
    } else {
      result.beneficiaryDocuments = result.beneficiaryDocuments.map((d: any) => ({
        ...d,
        verifiedByName: null,
      }));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET /api/admin/members/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to fetch member details' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    if (typeof body.phone === 'string' && body.phone) {
      body.phone = body.phone.replace(/\D/g, '');
      if (body.phone.length === 12 && body.phone.startsWith('91')) {
        body.phone = body.phone.slice(2);
      }
    }
    const parsed = updateMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    if ('status' in body) {
      return NextResponse.json(
        { error: 'Status changes are not allowed here. Use PATCH /api/admin/members/[id]/status, or PATCH .../delete / .../restore for deletion.' },
        { status: 400 },
      );
    }

    const existing = await prisma.profile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const { beneficiaryDetail, beneficiaryAddresses, ...profileFields } = parsed.data;

    const profile = await prisma.$transaction(async (tx) => {
      const updated = await tx.profile.update({
        where: { id },
        data: {
          ...(profileFields.aadhaarNumber !== undefined && {
            aadhaarNumber: profileFields.aadhaarNumber?.replace(/-/g, '') ?? null,
          }),
          ...(profileFields.panNumber !== undefined && {
            panNumber: profileFields.panNumber?.toUpperCase() ?? null,
          }),
          ...(profileFields.fullName !== undefined && { fullName: profileFields.fullName }),
          ...(profileFields.phone !== undefined && { phone: profileFields.phone ?? null }),
          ...(profileFields.gender !== undefined && { gender: profileFields.gender ?? null }),
          ...(profileFields.dob !== undefined && { dob: profileFields.dob ?? null }),
          ...(profileFields.addressLine1 !== undefined && { addressLine1: profileFields.addressLine1 ?? null }),
          ...(profileFields.district !== undefined && { district: profileFields.district ?? null }),
          ...(profileFields.state !== undefined && { state: profileFields.state ?? null }),
          ...(profileFields.pincode !== undefined && { pincode: profileFields.pincode ?? null }),
          ...(profileFields.qualification !== undefined && { qualification: profileFields.qualification ?? null }),
          ...(profileFields.assignedVolunteer !== undefined && { assignedVolunteer: profileFields.assignedVolunteer ?? null }),
          ...(profileFields.fieldOfficer !== undefined && { fieldOfficer: profileFields.fieldOfficer ?? null }),
          ...(profileFields.coordinator !== undefined && { coordinator: profileFields.coordinator ?? null }),
          ...(profileFields.region !== undefined && { region: profileFields.region ?? null }),
          ...(profileFields.adminNotes !== undefined && { adminNotes: profileFields.adminNotes ?? null }),
        },
      });

      if (beneficiaryDetail !== undefined) {
        await tx.beneficiaryDetail.upsert({
          where: { profileId: id },
          create: { profileId: id, ...beneficiaryDetail },
          update: { ...beneficiaryDetail },
        });
      }

      if (beneficiaryAddresses !== undefined) {
        await tx.beneficiaryAddress.deleteMany({ where: { profileId: id } });
        if (beneficiaryAddresses.length > 0) {
          await tx.beneficiaryAddress.createMany({
            data: beneficiaryAddresses.map((addr) => ({ profileId: id, ...addr })),
          });
        }
      }

      return updated;
    });

    const completeProfile = await prisma.profile.findUnique({
      where: { id },
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

    await logActivity({
      entity: 'member',
      entityId: id,
      action: 'update',
      description: `Updated member ${profile.fullName} (${profile.email})`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(mapProfileDetail(completeProfile));
  } catch (error) {
    console.error('[PATCH /api/admin/members/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 },
    );
  }
}
