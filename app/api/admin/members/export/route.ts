import { NextRequest, NextResponse } from 'next/server';
import { requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const response = await withRetry(async () => {
    const body = await request.json();
    const ids: string[] | undefined = body.ids;

    // If ids provided, export only those; otherwise export all non-deleted members
    const where: Prisma.ProfileWhereInput = { role: 'member', status: { not: 'deleted' } };
    if (ids && ids.length > 0) {
      where.id = { in: ids };
    }

    const profiles = await prisma.profile.findMany({
      where,
      include: {
        beneficiaryDetail: true,
        beneficiaryAddresses: { orderBy: { createdAt: 'desc' }, take: 1 },
        beneficiaryDocuments: { orderBy: { createdAt: 'desc' } },
        courseEnrollments: {
          include: { course: { select: { id: true, title: true } } },
          orderBy: { enrollmentDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results = profiles.map((p) => {
      const dob = p.dob as Date | null;
      const age = dob
        ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

      const addr = p.beneficiaryAddresses?.[0] ?? null;
      const detail = p.beneficiaryDetail;

      const docsVerified = p.beneficiaryDocuments.filter(d => d.status === 'verified').length;
      const docsTotal = p.beneficiaryDocuments.length;

      return {
        id: p.id,
        fullName: p.fullName,
        email: p.email,
        phone: p.phone,
        age,
        gender: p.gender,
        dob: dob?.toISOString().split('T')[0] ?? null,
        status: p.status,
        aadhaarNumber: p.aadhaarNumber,
        panNumber: p.panNumber,
        addressLine1: p.addressLine1,
        district: p.district,
        state: p.state,
        pincode: p.pincode,
        qualification: p.qualification,
        assignedVolunteer: p.assignedVolunteer,
        createdAt: p.registrationDate?.toISOString().split('T')[0] ?? p.createdAt.toISOString().split('T')[0],

        // Address
        village: addr?.village ?? null,
        taluka: addr?.taluka ?? null,

        // Beneficiary detail
        category: detail?.category ?? null,
        occupation: detail?.occupation ?? null,
        educationQualification: detail?.educationQualification ?? null,
        maritalStatus: detail?.maritalStatus ?? null,
        bloodGroup: detail?.bloodGroup ?? null,

        // Documents
        documentsVerified: docsVerified,
        documentsTotal: docsTotal,
        documents: p.beneficiaryDocuments.map(d => ({
          type: d.type,
          label: d.label,
          status: d.status,
        })),

        // Enrollments
        enrollments: p.courseEnrollments.map(e => ({
          courseTitle: e.course?.title ?? 'Unknown',
          status: e.status,
          completionDate: e.completionDate?.toISOString().split('T')[0] ?? null,
        })),
      };
    });

    return NextResponse.json({ data: results });
    });

    return response;
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error('[POST /api/admin/members/export]', error);
    return NextResponse.json(
      { error: 'Failed to export members' },
      { status: 500 },
    );
  }
}
