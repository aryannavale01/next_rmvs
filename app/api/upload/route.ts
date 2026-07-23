import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { uploadFile, generateSignedUrl, deleteFile } from '@/lib/supabase-storage';
import { validateFile, fileTypeToExtension, fileTypeToMime } from '@/lib/file-validation';
import { BUCKETS, buildStoragePath, SIGNED_URL_EXPIRY, type DocumentType } from '@/lib/upload-config';
import sharp from 'sharp';

const ALLOWED_DOC_TYPES: DocumentType[] = ['aadhaar', 'pan', 'rationCard', 'profilePhoto'];

function extractStoragePath(fileUrl: string): string | null {
  // The DB stores raw storage paths (e.g., "user-1/aadhaar/12345.webp"), not signed URLs.
  // But if a signed URL was somehow stored, parse the path from it.
  try {
    const url = new URL(fileUrl);
    const objectPath = url.pathname.split('/object/')[1];
    if (!objectPath) return null;
    const parts = objectPath.split('/');
    if (parts.length < 3) return null;
    return parts.slice(2).join('/');
  } catch {
    // Not a valid URL — treat as a raw storage path
    if (fileUrl.includes('/') && !fileUrl.startsWith('http')) {
      return fileUrl;
    }
    return null;
  }
}

export async function POST(request: Request) {
  // 1. Auth FIRST — before parsing any body
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

    // 2. Cross-check profileId — reject if client sends a different user's profileId
    if (docType !== 'profilePhoto') {
      const clientProfileId = formData.get('profileId') as string | null;
      if (clientProfileId && clientProfileId !== userId) {
        return NextResponse.json({ error: 'Forbidden: profileId mismatch' }, { status: 403 });
      }
    }

    // 3. Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Validate: size + magic bytes
    const validation = validateFile(buffer, docType);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 5. Process: images → sharp resize + WebP, PDFs → pass through
    let processedBuffer: Buffer;
    let contentType: string;
    let extension: string;

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

    // 6. Build deterministic storage path — no original filename
    const bucket = BUCKETS[docType];
    const storagePath = buildStoragePath(userId, docType, extension);

    // 7. Check for existing file to replace (looked up from DB, not client-supplied)
    let existingStoragePath: string | null = null;

    if (docType === 'profilePhoto') {
      const profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { avatarUrl: true },
      });
      if (profile?.avatarUrl) {
        existingStoragePath = extractStoragePath(profile.avatarUrl);
      }
    } else {
      const doc = await prisma.beneficiaryDocument.findFirst({
        where: { profileId: userId, type: docType },
        select: { fileUrl: true },
      });
      if (doc?.fileUrl) {
        existingStoragePath = extractStoragePath(doc.fileUrl);
      }
    }

    // 8. Upload new file
    await uploadFile(bucket, storagePath, processedBuffer, contentType);

    // 9. Delete old file (after successful upload, to avoid zero-file window)
    if (existingStoragePath) {
      try {
        await deleteFile(bucket, existingStoragePath);
      } catch {
        // Log but don't fail — old file orphaned is better than losing new upload
        console.error('[upload] Failed to delete old file:', existingStoragePath);
      }
    }

    // 10. Update DB
    if (docType === 'profilePhoto') {
      await prisma.profile.update({
        where: { id: userId },
        data: { avatarUrl: storagePath },
      });
    } else {
      // Upsert: create if not exists, update if exists
      const existing = await prisma.beneficiaryDocument.findFirst({
        where: { profileId: userId, type: docType },
        select: { id: true },
      });

      if (existing) {
        await prisma.beneficiaryDocument.update({
          where: { id: existing.id },
          data: {
            fileUrl: storagePath,
            status: 'pending',
            uploadedDate: new Date(),
          },
        });
      } else {
        await prisma.beneficiaryDocument.create({
          data: {
            profileId: userId,
            type: docType,
            label: docType.charAt(0).toUpperCase() + docType.slice(1),
            fileUrl: storagePath,
            status: 'pending',
            uploadedDate: new Date(),
          },
        });
      }
    }

    // Invalidate cached profile page so fresh data loads on next navigation
    try { revalidatePath('/dashboard/profile'); } catch { /* no-op outside Next.js server context */ }

    // 11. Generate signed URL for client display
    const signedUrl = await generateSignedUrl(bucket, storagePath, SIGNED_URL_EXPIRY);

    return NextResponse.json({
      signedUrl,
      expiresAt: new Date(Date.now() + SIGNED_URL_EXPIRY * 1000).toISOString(),
      storagePath,
      fileName: file.name,
    });

  } catch (error) {
    console.error('[upload] POST error:', error);
    return NextResponse.json({ error: 'Upload failed — try again' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  // 1. Auth FIRST
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

    // 2. Verify ownership via DB — never trust client-supplied paths
    let fileUrl: string | null = null;

    if (docType === 'profilePhoto') {
      const profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { avatarUrl: true },
      });
      fileUrl = profile?.avatarUrl ?? null;
    } else {
      if (!recordId) {
        return NextResponse.json({ error: 'recordId required for document deletion' }, { status: 400 });
      }
      const doc = await prisma.beneficiaryDocument.findFirst({
        where: { id: recordId, profileId: userId, type: docType },
        select: { fileUrl: true },
      });
      fileUrl = doc?.fileUrl ?? null;
    }

    if (!fileUrl) {
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 });
    }

    // 3. Extract storage path from the URL
    const storagePath = extractStoragePath(fileUrl);
    if (!storagePath) {
      return NextResponse.json({ error: 'Invalid file reference' }, { status: 400 });
    }

    // 4. Delete from Storage
    await deleteFile(bucket, storagePath);

    // 5. Update DB — clear the file reference
    if (docType === 'profilePhoto') {
      await prisma.profile.update({
        where: { id: userId },
        data: { avatarUrl: null },
      });
    } else {
      await prisma.beneficiaryDocument.update({
        where: { id: recordId! },
        data: { fileUrl: null, status: 'not_uploaded', uploadedDate: null },
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[upload] DELETE error:', error);
    return NextResponse.json({ error: 'Delete failed — try again' }, { status: 500 });
  }
}
