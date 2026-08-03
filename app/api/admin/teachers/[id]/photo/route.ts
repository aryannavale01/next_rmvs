import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, authErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { uploadFile, deleteFile, getPublicUrl } from '@/lib/supabase-storage';
import { BUCKETS } from '@/lib/upload-config';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

const BUCKET = BUCKETS.profilePhoto;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  try {
    const { id } = await params;

    const existing = await withRetry(() =>
      prisma.teacher.findUnique({ where: { id }, select: { id: true, profilePhoto: true } }),
    );
    if (!existing) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      return NextResponse.json({ error: 'Profile photo must be a valid image (JPEG, PNG, or WebP)' }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Profile photo must be under 20MB' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    let sourceBuffer = Buffer.from(arrayBuffer);

    if (sourceBuffer.length > 2 * 1024 * 1024) {
      try {
        sourceBuffer = await sharp(sourceBuffer)
          .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
      } catch {
        return NextResponse.json({ error: 'Failed to process image — file may be corrupted' }, { status: 400 });
      }
    }

    let hqBuffer: Buffer;
    let avatarBuffer: Buffer;

    try {
      [hqBuffer, avatarBuffer] = await Promise.all([
        sharp(sourceBuffer)
          .resize(800, 800, { fit: 'cover', withoutEnlargement: true })
          .webp({ quality: 92 })
          .toBuffer(),
        sharp(sourceBuffer)
          .resize(256, 256, { fit: 'cover' })
          .webp({ quality: 78 })
          .toBuffer(),
      ]);
    } catch {
      return NextResponse.json({ error: 'Failed to process image — file may be corrupted' }, { status: 400 });
    }

    const timestamp = Date.now();
    const hqPath = `teachers/${id}/hq-${timestamp}.webp`;
    const avatarPath = `teachers/${id}/avatar-${timestamp}.webp`;

    const oldPath = existing.profilePhoto;

    await Promise.all([
      uploadFile(BUCKET, hqPath, hqBuffer, 'image/webp'),
      uploadFile(BUCKET, avatarPath, avatarBuffer, 'image/webp'),
    ]);

    await withRetry(() =>
      prisma.teacher.update({
        where: { id },
        data: { profilePhoto: avatarPath },
      }),
    );

    if (oldPath) {
      try { await deleteFile(BUCKET, oldPath); } catch { /* ignore */ }
    }

    await logActivity({
      entity: 'teacher',
      entityId: id,
      action: 'update',
      description: `Updated profile photo for teacher`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({
      profilePhoto: getPublicUrl(BUCKET, avatarPath),
      profilePhotoHQ: getPublicUrl(BUCKET, hqPath),
      storagePath: avatarPath,
    });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error('[POST /api/admin/teachers/[id]/photo]', error);
    return NextResponse.json(
      { error: 'Failed to upload photo — try again' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  try {
    const { id } = await params;

    const existing = await withRetry(() =>
      prisma.teacher.findUnique({ where: { id }, select: { profilePhoto: true } }),
    );
    if (!existing) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    if (existing.profilePhoto) {
      try { await deleteFile(BUCKET, existing.profilePhoto); } catch { /* ignore */ }
    }

    await withRetry(() =>
      prisma.teacher.update({
        where: { id },
        data: { profilePhoto: null },
      }),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error('[DELETE /api/admin/teachers/[id]/photo]', error);
    return NextResponse.json(
      { error: 'Failed to delete photo — try again' },
      { status: 500 },
    );
  }
}
