import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, authErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
import { generateSignedUrl } from '@/lib/supabase-storage';
import { BUCKETS } from '@/lib/upload-config';
import { logActivity } from '@/lib/activity-log';

export const dynamic = 'force-dynamic';

const DOC_TYPE_TO_BUCKET: Record<string, string> = {
  aadhaar: BUCKETS.aadhaar,
  pan: BUCKETS.pan,
  rationCard: BUCKETS.rationCard,
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  try {
    const { id, docId } = await params;

    const doc = await withRetry(() =>
      prisma.beneficiaryDocument.findUnique({ where: { id: docId } }),
    );
    if (!doc || doc.profileId !== id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!doc.fileUrl) {
      return NextResponse.json({ error: 'Document file not available' }, { status: 404 });
    }

    const bucket = DOC_TYPE_TO_BUCKET[doc.type];
    if (!bucket) {
      return NextResponse.json({ error: 'Unknown document type' }, { status: 400 });
    }

    const signedUrl = await generateSignedUrl(bucket, doc.fileUrl, 3600);

    await logActivity({
      entity: 'member',
      entityId: id,
      action: 'document_view',
      description: `Viewed document "${doc.label}" (${doc.type}) for member`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.redirect(signedUrl);
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error('[GET /api/admin/members/[id]/documents/[docId]/view]', error);
    return NextResponse.json(
      { error: 'Failed to generate document URL' },
      { status: 500 },
    );
  }
}
