import { NextRequest, NextResponse } from 'next/server';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { generateSignedUrl } from '@/lib/supabase-storage';
import { OrgDocumentType } from '@prisma/client';

export const dynamic = 'force-dynamic';

const ORG_DOCS_BUCKET = 'org-documents';
const SIGNED_URL_EXPIRY = 2592000; // 30 days

type OrgDocRow = {
  id: string;
  type: OrgDocumentType;
  title: string;
  description: string | null;
  storagePath: string | null;
  mimeType: string | null;
  fileSize: number | null;
  year: number | null;
  displayOrder: number;
};

const TYPE_LABELS: Record<string, string> = {
  NGO_REGISTRATION_CERTIFICATE: 'NGO Registration Certificate',
  PAN_CARD: 'PAN Card',
  TAN_CARD: 'TAN Card',
  NITI_AAYOG_REGISTRATION: 'NITI Aayog Registration',
  CSR1: 'CSR1 Certificate',
  ANNUAL_REPORT: 'Annual Reports',
  WORK_ORDER: 'Work Orders',
  ORG_PROFILE: 'Organisation Profile',
  CERTIFICATE_12A: '12A Registration',
  CERTIFICATE_80G: '80G Certificate',
};

export async function GET(_request: NextRequest) {
  try {
    const docs = await withRetry(() =>
      prisma.orgDocument.findMany({
        where: { isPublic: true, isActive: true },
        orderBy: [{ type: 'asc' }, { displayOrder: 'asc' }],
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          storagePath: true,
          mimeType: true,
          fileSize: true,
          year: true,
          displayOrder: true,
        },
      }),
    );

    const docsWithUrls = await Promise.all(
      docs.map(async (doc: OrgDocRow) => {
        let fileUrl: string | null = null;
        if (doc.storagePath) {
          try {
            fileUrl = await generateSignedUrl(ORG_DOCS_BUCKET, doc.storagePath, SIGNED_URL_EXPIRY);
          } catch {
            console.error('[GET /api/public/org-documents] Failed to generate signed URL for:', doc.id);
          }
        }
        return {
          id: doc.id,
          type: doc.type,
          typeLabel: TYPE_LABELS[doc.type] || doc.type,
          title: doc.title,
          description: doc.description,
          fileUrl,
          mimeType: doc.mimeType,
          fileSize: doc.fileSize,
          year: doc.year,
          displayOrder: doc.displayOrder,
        };
      }),
    );

    return NextResponse.json({ documents: docsWithUrls });
  } catch (error) {
    console.error('[GET /api/public/org-documents]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
