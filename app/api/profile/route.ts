import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { generateSignedUrl } from '@/lib/supabase-storage';
import { BUCKETS, SIGNED_URL_EXPIRY, type DocumentType } from '@/lib/upload-config';

const DOC_TYPE_TO_BUCKET: Record<string, string> = {
  aadhaar: BUCKETS.aadhaar,
  pan: BUCKETS.pan,
  rationCard: BUCKETS.rationCard,
  profilePhoto: BUCKETS.profilePhoto,
};

export async function GET(request: Request) {
  const auth = await requireAuth(new Headers(request.headers));
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = auth.session.user.id;

  try {
    // Load profile from DB
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: {
        fullName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        aadhaarNumber: true,
        panNumber: true,
        gender: true,
        dob: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Generate fresh signed URL for profile photo
    let photoUrl = '';
    if (profile.avatarUrl) {
      try {
        photoUrl = await generateSignedUrl(BUCKETS.profilePhoto, profile.avatarUrl, SIGNED_URL_EXPIRY);
      } catch {
        // If signed URL generation fails (file missing from storage), clear the reference
        console.error('[profile] Failed to generate signed URL for avatar:', profile.avatarUrl);
      }
    }

    // Load beneficiary documents
    const docs = await prisma.beneficiaryDocument.findMany({
      where: { profileId: userId },
      select: { type: true, label: true, fileUrl: true, status: true, uploadedDate: true },
    });

    // Generate fresh signed URLs for each document
    const documents: Record<string, { uploaded: boolean; name: string; date: string; signedUrl: string }> = {};

    for (const doc of docs) {
      const bucket = DOC_TYPE_TO_BUCKET[doc.type];
      if (!bucket || !doc.fileUrl) continue;

      let signedUrl = '';
      try {
        signedUrl = await generateSignedUrl(bucket, doc.fileUrl, SIGNED_URL_EXPIRY);
      } catch {
        console.error(`[profile] Failed to generate signed URL for ${doc.type}:`, doc.fileUrl);
      }

      documents[doc.type] = {
        uploaded: true,
        name: doc.label,
        date: doc.uploadedDate ? doc.uploadedDate.toISOString().split('T')[0] : '',
        signedUrl,
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
      photoUrl,
      documents: {
        aadhaar: documents.aadhaar || { uploaded: false, name: '', date: '', signedUrl: '' },
        pan: documents.pan || { uploaded: false, name: '', date: '', signedUrl: '' },
        rationCard: documents.rationCard || { uploaded: false, name: '', date: '', signedUrl: '' },
      },
    });

  } catch (error) {
    console.error('[profile] GET error:', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}
