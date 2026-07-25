import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { uploadFile, generateSignedUrl, deleteFile, getPublicUrl } from '@/lib/supabase-storage';
import { validateFile } from '@/lib/file-validation';
import { BUCKETS, SIGNED_URL_EXPIRY, type DocumentType } from '@/lib/upload-config';
import sharp from 'sharp';

const ALLOWED_DOC_TYPES: DocumentType[] = ['aadhaar', 'pan', 'rationCard', 'profilePhoto'];

export async function POST(request: Request) {
  const auth = await requireAuth(new Headers(request.headers));
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = auth.session.user.id;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('documentType') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!documentType || !ALLOWED_DOC_TYPES.includes(documentType as DocumentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    const docType = documentType as DocumentType;

    if (docType !== 'profilePhoto') {
      const clientProfileId = formData.get('profileId') as string | null;
      if (clientProfileId && clientProfileId !== userId) {
        return NextResponse.json({ error: 'Forbidden: profileId mismatch' }, { status: 403 });
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucket = BUCKETS[docType];

    if (docType === 'profilePhoto') {
      if (buffer.length > 20 * 1024 * 1024) {
        return NextResponse.json({ error: 'Profile photo must be under 20MB' }, { status: 400 });
      }
      const { detectFileType } = await import('@/lib/file-validation');
      const fileType = detectFileType(buffer);
      if (!fileType || fileType === 'pdf') {
        return NextResponse.json({ error: 'Profile photo must be a valid image (JPEG, PNG, or WebP)' }, { status: 400 });
      }
      return await handleProfilePhotoUpload(userId, buffer, bucket);
    }

    const validation = validateFile(buffer, docType);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    return await handleDocumentUpload(userId, buffer, docType, bucket, file.name);

  } catch (error) {
    console.error('[upload] POST error:', error);
    return NextResponse.json({ error: 'Upload failed — try again' }, { status: 500 });
  }
}

async function handleProfilePhotoUpload(
  userId: string,
  inputBuffer: Buffer,
  bucket: string,
) {
  const timestamp = Date.now();

  // If raw input exceeds 2MB, pre-compress to reduce memory usage in sharp
  let sourceBuffer = inputBuffer;
  if (inputBuffer.length > 2 * 1024 * 1024) {
    try {
      sourceBuffer = await sharp(inputBuffer)
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch {
      return NextResponse.json({ error: 'Failed to process image — file may be corrupted' }, { status: 400 });
    }
  }

  let hqBuffer: Buffer;
  let avatarBuffer: Buffer;
  let blurDataUrl: string;

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

    const blurBuffer = await sharp(sourceBuffer)
      .resize(20, 20, { fit: 'cover' })
      .webp({ quality: 20 })
      .toBuffer();
    blurDataUrl = `data:image/webp;base64,${blurBuffer.toString('base64')}`;
  } catch {
    return NextResponse.json({ error: 'Failed to process image — file may be corrupted' }, { status: 400 });
  }

  const hqPath = `${userId}/profilePhoto/hq-${timestamp}.webp`;
  const avatarPath = `${userId}/profilePhoto/avatar-${timestamp}.webp`;

  const existingProfile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { avatarUrl: true, photoUrlHQ: true },
  });

  const oldAvatarPath = existingProfile?.avatarUrl || null;
  const oldHqPath = existingProfile?.photoUrlHQ || null;

  await Promise.all([
    uploadFile(bucket, hqPath, hqBuffer, 'image/webp'),
    uploadFile(bucket, avatarPath, avatarBuffer, 'image/webp'),
  ]);

  await prisma.profile.update({
    where: { id: userId },
    data: {
      avatarUrl: avatarPath,
      photoUrlHQ: hqPath,
      photoBlurDataUrl: blurDataUrl,
    },
  });

  const deletePaths = [oldAvatarPath, oldHqPath].filter(
    (p): p is string => p !== null && p !== avatarPath && p !== hqPath,
  );
  for (const oldPath of deletePaths) {
    try {
      await deleteFile(bucket, oldPath);
    } catch {
      console.error('[upload] Failed to delete old profile photo:', oldPath);
    }
  }

  try { revalidatePath('/dashboard/profile'); } catch { /* no-op outside Next.js server context */ }

  return NextResponse.json({
    signedUrl: getPublicUrl(BUCKETS.profilePhoto, avatarPath),
    photoUrl: getPublicUrl(BUCKETS.profilePhoto, avatarPath),
    photoUrlHQ: getPublicUrl(BUCKETS.profilePhoto, hqPath),
    photoBlurDataUrl: blurDataUrl,
    storagePath: avatarPath,
    fileName: 'profile-photo.webp',
  });
}

async function handleDocumentUpload(
  userId: string,
  buffer: Buffer,
  docType: DocumentType,
  bucket: string,
  originalName: string,
) {
  let processedBuffer: Buffer;
  let contentType: string;
  let extension: string;

  const validation = validateFile(buffer, docType);

  if (validation.fileType === 'pdf') {
    processedBuffer = buffer;
    contentType = 'application/pdf';
    extension = 'pdf';
  } else {
    try {
      processedBuffer = await sharp(buffer)
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer();
      contentType = 'image/webp';
      extension = 'webp';
    } catch {
      return NextResponse.json({ error: 'Failed to process image — file may be corrupted' }, { status: 400 });
    }
  }

  const timestamp = Date.now();
  const storagePath = `${userId}/${docType}/${timestamp}.${extension}`;

  const doc = await prisma.beneficiaryDocument.findFirst({
    where: { profileId: userId, type: docType },
    select: { id: true, fileUrl: true },
  });

  const existingPath = doc?.fileUrl || null;

  await uploadFile(bucket, storagePath, processedBuffer, contentType);

  if (existingPath) {
    try { await deleteFile(bucket, existingPath); } catch {
      console.error('[upload] Failed to delete old document:', existingPath);
    }
  }

  let recordId: string;
  if (doc) {
    await prisma.beneficiaryDocument.update({
      where: { id: doc.id },
      data: { fileUrl: storagePath, status: 'pending', uploadedDate: new Date() },
    });
    recordId = doc.id;
  } else {
    const newDoc = await prisma.beneficiaryDocument.create({
      data: {
        profileId: userId,
        type: docType,
        label: docType.charAt(0).toUpperCase() + docType.slice(1),
        fileUrl: storagePath,
        status: 'pending',
        uploadedDate: new Date(),
      },
    });
    recordId = newDoc.id;
  }

  try { revalidatePath('/dashboard/profile'); } catch { /* no-op outside Next.js server context */ }

  const signedUrl = await generateSignedUrl(bucket, storagePath, SIGNED_URL_EXPIRY);

  return NextResponse.json({
    recordId,
    signedUrl,
    expiresAt: new Date(Date.now() + SIGNED_URL_EXPIRY * 1000).toISOString(),
    storagePath,
    fileName: originalName,
  });
}

export async function DELETE(request: Request) {
  const auth = await requireAuth(new Headers(request.headers));
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = auth.session.user.id;

  try {
    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('documentType');
    const recordId = searchParams.get('recordId');

    if (!documentType || !ALLOWED_DOC_TYPES.includes(documentType as DocumentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    const docType = documentType as DocumentType;
    const bucket = BUCKETS[docType];

    if (docType === 'profilePhoto') {
      const profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { avatarUrl: true, photoUrlHQ: true },
      });

      const pathsToDelete = [profile?.avatarUrl, profile?.photoUrlHQ].filter(
        (p): p is string => !!p,
      );

      await prisma.profile.update({
        where: { id: userId },
        data: { avatarUrl: null, photoUrlHQ: null, photoBlurDataUrl: null },
      });

      for (const path of pathsToDelete) {
        try { await deleteFile(bucket, path); } catch {
          console.error('[upload] Failed to delete profile photo:', path);
        }
      }

      return NextResponse.json({ success: true });
    }

    if (!recordId) {
      return NextResponse.json({ error: 'recordId required for document deletion' }, { status: 400 });
    }

    const doc = await prisma.beneficiaryDocument.findFirst({
      where: { id: recordId, profileId: userId, type: docType },
      select: { id: true, fileUrl: true },
    });

    if (!doc?.fileUrl) {
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 });
    }

    await deleteFile(bucket, doc.fileUrl);

    await prisma.beneficiaryDocument.update({
      where: { id: doc.id },
      data: { fileUrl: null, status: 'not_uploaded', uploadedDate: null, verifiedDate: null },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[upload] DELETE error:', error);
    return NextResponse.json({ error: 'Delete failed — try again' }, { status: 500 });
  }
}
