import { NextRequest, NextResponse } from 'next/server';
import { requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { uploadFile, deleteFile, getPublicUrl } from '@/lib/supabase-storage';
import { BUCKETS, MAX_CMS_IMAGE_SIZE, CMS_IMAGE_PROCESSING } from '@/lib/upload-config';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

const BUCKET = BUCKETS.cmsImages;

export async function POST(request: NextRequest) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Please upload a valid image (JPEG, PNG, or WebP)' }, { status: 400 });
    }

    if (file.size > MAX_CMS_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image must be under 10MB' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    let processed: Buffer;
    try {
      processed = await sharp(Buffer.from(arrayBuffer))
        .resize(CMS_IMAGE_PROCESSING.width, CMS_IMAGE_PROCESSING.height, {
          fit: CMS_IMAGE_PROCESSING.fit,
          withoutEnlargement: CMS_IMAGE_PROCESSING.withoutEnlargement,
        })
        .webp({ quality: CMS_IMAGE_PROCESSING.quality })
        .toBuffer();
    } catch {
      return NextResponse.json({ error: 'Failed to process image — file may be corrupted' }, { status: 400 });
    }

    const path = `cms/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.webp`;
    await uploadFile(BUCKET, path, processed, 'image/webp');

    return NextResponse.json({ url: getPublicUrl(BUCKET, path), path });
  } catch (error) {
    console.error('[POST /api/admin/cms-images/upload]', error);
    return NextResponse.json(
      { error: 'Failed to upload image — try again' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    if (!path) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }
    if (!path.startsWith('cms/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }
    await deleteFile(BUCKET, path).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/cms-images/upload]', error);
    return NextResponse.json(
      { error: 'Failed to delete image — try again' },
      { status: 500 },
    );
  }
}
