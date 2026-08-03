import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, authErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
import { reviewDocumentSchema } from '@/lib/validations/admin-member';
import { logActivity } from '@/lib/activity-log';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  try {
    const { id, docId } = await params;
    const body = await request.json();
    const parsed = reviewDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const profile = await withRetry(() => prisma.profile.findUnique({ where: { id } }));
    if (!profile) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const doc = await withRetry(() => prisma.beneficiaryDocument.findUnique({ where: { id: docId } }));
    if (!doc || doc.profileId !== id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const { action, rejectionReason } = parsed.data;
    const now = new Date();

    if (action === 'verify') {
      if (doc.status === 'verified') {
        return NextResponse.json(doc, { status: 200 });
      }
      if (doc.status === 'rejected') {
        return NextResponse.json(
          { error: 'Document is currently rejected. Refresh and try again.' },
          { status: 400 },
        );
      }

      const updated = await withRetry(() =>
        prisma.beneficiaryDocument.update({
          where: { id: docId },
          data: {
            status: 'verified',
            verifiedDate: now,
            verifiedBy: auth.session.user.id,
            rejectionReason: null,
          },
        }),
      );

      await logActivity({
        entity: 'member',
        entityId: id,
        action: 'document_verify',
        description: `Verified document "${doc.label}" (${doc.type}) for member ${profile.fullName} (${profile.email})`,
        performedBy: auth.session.user.id,
      });

      return NextResponse.json(updated);
    }

    if (action === 'reject') {
      if (doc.status === 'rejected') {
        return NextResponse.json(doc, { status: 200 });
      }
      if (doc.status === 'verified') {
        return NextResponse.json(
          { error: 'Document is currently verified. Refresh and try again.' },
          { status: 400 },
        );
      }

      const updated = await withRetry(() =>
        prisma.beneficiaryDocument.update({
          where: { id: docId },
          data: {
            status: 'rejected',
            verifiedDate: now,
            verifiedBy: auth.session.user.id,
            rejectionReason: rejectionReason!,
          },
        }),
      );

      await logActivity({
        entity: 'member',
        entityId: id,
        action: 'document_reject',
        description: `Rejected document "${doc.label}" (${doc.type}) for member ${profile.fullName} (${profile.email}): ${rejectionReason}`,
        performedBy: auth.session.user.id,
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error('[PATCH /api/admin/members/[id]/documents/[docId]]', error);
    return NextResponse.json(
      { error: 'Failed to review document' },
      { status: 500 },
    );
  }
}
