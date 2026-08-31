import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { updateGalleryItemSchema } from '@/lib/validations/admin-gallery-item';
import { logActivity } from '@/lib/activity-log';

export const dynamic = 'force-dynamic';

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
    const item = await withRetry(() => prisma.galleryItem.findUnique({ where: { id } }));
    if (!item) {
      return NextResponse.json({ error: 'Gallery item not found' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    console.error('[GET /api/admin/gallery-items/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch gallery item' }, { status: 500 });
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
    const parsed = updateGalleryItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await withRetry(() => prisma.galleryItem.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Gallery item not found' }, { status: 404 });
    }

    const updated = await withRetry(() => prisma.galleryItem.update({ where: { id }, data: parsed.data }));

    await logActivity({
      entity: 'gallery_item',
      entityId: id,
      action: 'gallery_item_update',
      description: `Updated gallery item "${updated.title}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/admin/gallery-items/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to update gallery item' }, { status: 500 });
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
    const existing = await withRetry(() => prisma.galleryItem.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Gallery item not found' }, { status: 404 });
    }

    await withRetry(() => prisma.galleryItem.update({ where: { id }, data: { status: 'deleted', deletedAt: new Date() } }));

    await logActivity({
      entity: 'gallery_item',
      entityId: id,
      action: 'gallery_item_delete',
      description: `Deleted gallery item "${existing.title}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/gallery-items/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to delete gallery item' }, { status: 500 });
  }
}
