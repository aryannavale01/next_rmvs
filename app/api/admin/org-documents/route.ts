import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { createOrgDocumentSchema } from '@/lib/validations/admin-org-document';
import { uploadFile, deleteFile, generateSignedUrl } from '@/lib/supabase-storage';
import { detectFileType, fileTypeToExtension, fileTypeToMime } from '@/lib/file-validation';
import { logActivity } from '@/lib/activity-log';
import { Prisma } from '@prisma/client';
import sharp from 'sharp';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ORG_DOCS_BUCKET = 'org-documents';
const ORG_DOCS_MAX_SIZE = 25 * 1024 * 1024; // 25MB
const SIGNED_URL_EXPIRY = 604800; // 7 days

const QuerySchema = z.object({
  search:         z.string().optional(),
  type:           z.string().optional(),
  isPublic:       z.coerce.boolean().optional(),
  year:           z.coerce.number().int().optional(),
  page:           z.coerce.number().int().min(1).default(1),
  pageSize:       z.coerce.number().int().min(1).max(100).default(20),
  sortBy:         z.enum(['title', 'type', 'year', 'displayOrder', 'createdAt']).default('displayOrder'),
  sortOrder:      z.enum(['asc', 'desc']).default('asc'),
});

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
    const where: Prisma.OrgDocumentWhereInput = {};
    if (q.search) {
      where.OR = [
        { title: { contains: q.search, mode: 'insensitive' } },
        { description: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    if (q.type) where.type = q.type as 'NGO_REGISTRATION_CERTIFICATE' | 'PAN_CARD' | 'TAN_CARD' | 'NITI_AAYOG_REGISTRATION' | 'CSR1' | 'ANNUAL_REPORT' | 'WORK_ORDER' | 'ORG_PROFILE' | 'CERTIFICATE_12A' | 'CERTIFICATE_80G';
    if (q.isPublic !== undefined) where.isPublic = q.isPublic;
    if (q.year) where.year = q.year;

    const skip = (q.page - 1) * q.pageSize;
    const [data, total] = await withRetry(() =>
      Promise.all([
        prisma.orgDocument.findMany({ where, orderBy: { [q.sortBy]: q.sortOrder }, skip, take: q.pageSize }),
        prisma.orgDocument.count({ where }),
      ]),
    );

    return NextResponse.json({
      data,
      pagination: { page: q.page, pageSize: q.pageSize, total, totalPages: Math.ceil(total / q.pageSize) },
    });
  } catch (error) {
    console.error('[GET /api/admin/org-documents]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch org documents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const metadataRaw: Record<string, string> = {};
    for (const [key, val] of formData.entries()) {
      if (key !== 'file' && typeof val === 'string') metadataRaw[key] = val;
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const parsed = createOrgDocumentSchema.safeParse(metadataRaw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > ORG_DOCS_MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 25MB limit' }, { status: 400 });
    }

    const fileType = detectFileType(buffer);
    if (!fileType) {
      return NextResponse.json({ error: 'Unsupported file type — use JPEG, PNG, WebP, or PDF' }, { status: 400 });
    }

    let processedBuffer: Buffer;
    let contentType: string;
    let extension: string;

    if (fileType === 'pdf') {
      processedBuffer = buffer;
      contentType = 'application/pdf';
      extension = 'pdf';
    } else {
      try {
        processedBuffer = await sharp(buffer)
          .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        contentType = 'image/webp';
        extension = 'webp';
      } catch {
        return NextResponse.json({ error: 'Failed to process image — file may be corrupted' }, { status: 400 });
      }
    }

    const timestamp = Date.now();
    const storagePath = `${parsed.data.type}/${timestamp}.${extension}`;

    await uploadFile(ORG_DOCS_BUCKET, storagePath, processedBuffer, contentType);

    const fileUrl = await generateSignedUrl(ORG_DOCS_BUCKET, storagePath, SIGNED_URL_EXPIRY);

    const doc = await withRetry(() =>
      prisma.orgDocument.create({
        data: {
          type: parsed.data.type,
          title: parsed.data.title,
          description: parsed.data.description ?? null,
          fileUrl,
          storagePath,
          mimeType: contentType,
          fileSize: buffer.length,
          year: parsed.data.year ?? null,
          isPublic: parsed.data.isPublic ?? true,
          displayOrder: parsed.data.displayOrder ?? 0,
          isActive: true,
          uploadedBy: auth.session.user.id,
        },
      }),
    );

    await logActivity({
      entity: 'org_document',
      entityId: doc.id,
      action: 'org_document_upload',
      description: `Uploaded "${doc.title}" (${doc.type})`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/org-documents]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to upload org document' }, { status: 500 });
  }
}
