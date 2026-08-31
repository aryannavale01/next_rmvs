import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { updateOrgDocumentSchema } from '@/lib/validations/admin-org-document';
import { deleteFile } from '@/lib/supabase-storage';
import { logActivity } from '@/lib/activity-log';

export const dynamic = 'force-dynamic';

const ORG_DOCS_BUCKET = 'org-documents';

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
    const doc = await withRetry(() => prisma.orgDocument.findUnique({ where: { id } }));
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    return NextResponse.json(doc);
  } catch (error) {
    console.error('[GET /api/admin/org-documents/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch org document' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateOrgDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await withRetry(() => prisma.orgDocument.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const updated = await withRetry(() => prisma.orgDocument.update({ where: { id }, data: parsed.data }));

    await logActivity({
      entity: 'org_document',
      entityId: id,
      action: 'org_document_update',
      description: `Updated "${updated.title}" (${updated.type})`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/admin/org-documents/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to update org document' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const { id } = await params;
    const existing = await withRetry(() => prisma.orgDocument.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await withRetry(() =>
      prisma.orgDocument.update({ where: { id }, data: { isActive: false } }),
    );

    if (existing.storagePath) {
      try {
        await deleteFile(ORG_DOCS_BUCKET, existing.storagePath);
      } catch (e) {
        console.error('[DELETE /api/admin/org-documents/[id]] Failed to delete file from storage:', e);
      }
    }

    await logActivity({
      entity: 'org_document',
      entityId: id,
      action: 'org_document_delete',
      description: `Deleted "${existing.title}" (${existing.type})`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/org-documents/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to delete org document' }, { status: 500 });
  }
}
