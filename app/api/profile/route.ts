import { NextResponse } from 'next/server';
import { requireAuth, authErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
import { generateSignedUrl, getPublicUrl } from '@/lib/supabase-storage';
import { BUCKETS, SIGNED_URL_EXPIRY, type DocumentType } from '@/lib/upload-config';

export const dynamic = 'force-dynamic';

const DOC_TYPE_TO_BUCKET: Record<string, string> = {
  aadhaar: BUCKETS.aadhaar,
  pan: BUCKETS.pan,
  rationCard: BUCKETS.rationCard,
};

type ProfileRow = {
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  photoUrlHQ: string | null;
  photoBlurDataUrl: string | null;
  aadhaarNumber: string | null;
  panNumber: string | null;
};

async function formatProfileResponse(profile: ProfileRow, userId: string) {
  const responsePhotoUrl = profile.avatarUrl ? getPublicUrl(BUCKETS.profilePhoto, profile.avatarUrl) : null;
  const responsePhotoUrlHQ = profile.photoUrlHQ ? getPublicUrl(BUCKETS.profilePhoto, profile.photoUrlHQ) : null;
  const responseBlurDataUrl = profile.photoBlurDataUrl || null;

  const docs = await prisma.beneficiaryDocument.findMany({
    where: { profileId: userId },
    select: { id: true, type: true, label: true, fileUrl: true, status: true, uploadedDate: true, verifiedDate: true },
  });

  const documents: Record<string, { recordId: string; uploaded: boolean; name: string | null; date: string | null; signedUrl: string | null; status: string; verifiedDate: string | null }> = {};

  const docsToSign = docs.filter(doc => DOC_TYPE_TO_BUCKET[doc.type] && doc.fileUrl);
  const signedUrls = await Promise.allSettled(
    docsToSign.map(doc => generateSignedUrl(DOC_TYPE_TO_BUCKET[doc.type], doc.fileUrl!, SIGNED_URL_EXPIRY))
  );

  const signedUrlMap = new Map<string, string | null>();
  docsToSign.forEach((doc, i) => {
    const result = signedUrls[i];
    signedUrlMap.set(doc.id, result.status === 'fulfilled' ? result.value : null);
  });

  for (const doc of docs) {
    documents[doc.type] = {
      recordId: doc.id,
      uploaded: doc.fileUrl !== null,
      name: doc.label,
      date: doc.uploadedDate ? doc.uploadedDate.toISOString().split('T')[0] : null,
      signedUrl: signedUrlMap.get(doc.id) ?? null,
      status: doc.status,
      verifiedDate: doc.verifiedDate?.toISOString() ?? null,
    };
  }

  const beneficiaryDetail = await prisma.beneficiaryDetail.findUnique({
    where: { profileId: userId },
    select: { rationCard: true },
  });

  const nameParts = profile.fullName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    firstName,
    lastName,
    email: profile.email,
    phone: profile.phone || '',
    aadhaarNo: profile.aadhaarNumber || '',
    panNo: profile.panNumber || '',
    rationCardNo: beneficiaryDetail?.rationCard || '',
    photoUrl: responsePhotoUrl,
    photoUrlHQ: responsePhotoUrlHQ,
    photoBlurDataUrl: responseBlurDataUrl,
    documents: {
      aadhaar: documents.aadhaar || { recordId: null, uploaded: false, name: null, date: null, signedUrl: null, status: 'not_uploaded', verifiedDate: null },
      pan: documents.pan || { recordId: null, uploaded: false, name: null, date: null, signedUrl: null, status: 'not_uploaded', verifiedDate: null },
      rationCard: documents.rationCard || { recordId: null, uploaded: false, name: null, date: null, signedUrl: null, status: 'not_uploaded', verifiedDate: null },
    },
  };
}

const PROFILE_SELECT = {
  fullName: true,
  email: true,
  phone: true,
  avatarUrl: true,
  photoUrlHQ: true,
  photoBlurDataUrl: true,
  aadhaarNumber: true,
  panNumber: true,
  gender: true,
  dob: true,
} as const;

export async function GET(request: Request) {
  const auth = await requireAuth(new Headers(request.headers));
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  const userId = auth.session.user.id;

  try {
    const profile = await withRetry(() =>
      prisma.profile.findUnique({
        where: { id: userId },
        select: PROFILE_SELECT,
      })
    );

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const formatted = await withRetry(() => formatProfileResponse(profile, userId));
    return NextResponse.json(formatted);
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error('[profile] GET error:', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAuth(new Headers(request.headers));
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  const userId = auth.session.user.id;

  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, aadhaarNo, panNo, rationCardNo } = body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      aadhaarNo?: string;
      panNo?: string;
      rationCardNo?: string;
    };

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    await withRetry(() =>
      prisma.$transaction(async (tx) => {
        await tx.profile.update({
          where: { id: userId },
          data: {
            fullName,
            email,
            phone: phone || null,
            aadhaarNumber: aadhaarNo || null,
            panNumber: panNo || null,
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: { email },
        });

        if (rationCardNo !== undefined) {
          await tx.beneficiaryDetail.upsert({
            where: { profileId: userId },
            create: { profileId: userId, rationCard: rationCardNo || null },
            update: { rationCard: rationCardNo || null },
          });
        }
      })
    );

    const updatedProfile = await withRetry(() =>
      prisma.profile.findUnique({
        where: { id: userId },
        select: PROFILE_SELECT,
      })
    );

    if (!updatedProfile) {
      return NextResponse.json({ error: 'Profile not found after update' }, { status: 500 });
    }

    const formatted = await withRetry(() => formatProfileResponse(updatedProfile, userId));
    return NextResponse.json(formatted);
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error('[profile] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
