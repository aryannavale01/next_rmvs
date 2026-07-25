import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { generateSignedUrl, getPublicUrl } from '@/lib/supabase-storage';
import { BUCKETS, SIGNED_URL_EXPIRY, type DocumentType } from '@/lib/upload-config';

export const dynamic = 'force-dynamic';

const DOC_TYPE_TO_BUCKET: Record<string, string> = {
  aadhaar: BUCKETS.aadhaar,
  pan: BUCKETS.pan,
  rationCard: BUCKETS.rationCard,
};

export async function GET(request: Request) {
  const auth = await requireAuth(new Headers(request.headers));
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = auth.session.user.id;

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: {
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
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const responsePhotoUrl = profile.avatarUrl ? getPublicUrl(BUCKETS.profilePhoto, profile.avatarUrl) : null;
    const responsePhotoUrlHQ = profile.photoUrlHQ ? getPublicUrl(BUCKETS.profilePhoto, profile.photoUrlHQ) : null;
    const responseBlurDataUrl = profile.photoBlurDataUrl || null;

    // Load beneficiary documents
    const docs = await prisma.beneficiaryDocument.findMany({
      where: { profileId: userId },
      select: { id: true, type: true, label: true, fileUrl: true, status: true, uploadedDate: true, verifiedDate: true },
    });

    // Generate fresh signed URLs for each document
    const documents: Record<string, { recordId: string; uploaded: boolean; name: string | null; date: string | null; signedUrl: string | null; status: string; verifiedDate: string | null }> = {};

    for (const doc of docs) {
      const bucket = DOC_TYPE_TO_BUCKET[doc.type];
      let signedUrl: string | null = null;

      if (bucket && doc.fileUrl) {
        try {
          signedUrl = await generateSignedUrl(bucket, doc.fileUrl, SIGNED_URL_EXPIRY);
        } catch {
          console.error(`[profile] Failed to generate signed URL for ${doc.type}:`, doc.fileUrl);
        }
      }

      documents[doc.type] = {
        recordId: doc.id,
        uploaded: doc.fileUrl !== null,
        name: doc.label,
        date: doc.uploadedDate ? doc.uploadedDate.toISOString().split('T')[0] : null,
        signedUrl,
        status: doc.status,
        verifiedDate: doc.verifiedDate?.toISOString() ?? null,
      };
    }

    // Parse name into first/last
    const nameParts = profile.fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return NextResponse.json({
      firstName,
      lastName,
      email: profile.email,
      phone: profile.phone || '',
      aadhaarNo: profile.aadhaarNumber || '',
      panNo: profile.panNumber || '',
      rationCardNo: '',
      photoUrl: responsePhotoUrl,
      photoUrlHQ: responsePhotoUrlHQ,
      photoBlurDataUrl: responseBlurDataUrl,
      documents: {
        aadhaar: documents.aadhaar || { recordId: null, uploaded: false, name: null, date: null, signedUrl: null, status: 'not_uploaded', verifiedDate: null },
        pan: documents.pan || { recordId: null, uploaded: false, name: null, date: null, signedUrl: null, status: 'not_uploaded', verifiedDate: null },
        rationCard: documents.rationCard || { recordId: null, uploaded: false, name: null, date: null, signedUrl: null, status: 'not_uploaded', verifiedDate: null },
      },
    });

  } catch (error) {
    console.error('[profile] GET error:', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}
