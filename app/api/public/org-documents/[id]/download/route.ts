import { NextRequest, NextResponse } from 'next/server';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { generateSignedUrl } from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';

const ORG_DOCS_BUCKET = 'org-documents';
const DOWNLOAD_URL_EXPIRY = 3600; // 1 hour for download links

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const doc = await withRetry(() =>
      prisma.orgDocument.findUnique({
        where: { id },
        select: { storagePath: true, isPublic: true, isActive: true, title: true },
      }),
    );

    if (!doc || !doc.isActive || !doc.isPublic || !doc.storagePath) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const signedUrl = await generateSignedUrl(ORG_DOCS_BUCKET, doc.storagePath, DOWNLOAD_URL_EXPIRY);

    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error('[GET /api/public/org-documents/[id]/download]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
