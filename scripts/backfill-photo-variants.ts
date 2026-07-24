/**
 * Backfill script: Generate HQ + blur variants for existing profile photos.
 *
 * Usage: npx tsx scripts/backfill-photo-variants.ts
 *
 * This script:
 * 1. Finds all profiles with avatarUrl but missing photoUrlHQ or photoBlurDataUrl
 * 2. Downloads the existing image from Supabase storage using the stored path
 * 3. Generates HQ (800x800 WebP@92%) and blur (20x20 WebP@20%) variants
 * 4. Uploads the new variants to storage
 * 5. Updates the DB with the new paths
 *
 * NOTE: If the existing avatarUrl is a low-res image (e.g., 256x256 from old uploads),
 * the HQ variant will be upscaled and may not be truly high-quality. These profiles
 * are flagged for the user to re-upload a fresh photo.
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'profile-photos';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface BackfillResult {
  processed: number;
  skipped: number;
  flagged: number;
  errors: number;
}

async function downloadFile(path: string): Promise<Buffer | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) {
    console.error(`  Failed to download ${path}:`, error.message);
    return null;
  }
  return Buffer.from(await data.arrayBuffer());
}

async function uploadFile(path: string, buffer: Buffer): Promise<boolean> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: 'image/webp', upsert: false });
  if (error) {
    console.error(`  Failed to upload ${path}:`, error.message);
    return false;
  }
  return true;
}

async function backfillProfile(profile: {
  id: string;
  avatarUrl: string | null;
  photoUrlHQ: string | null;
  photoBlurDataUrl: string | null;
}): Promise<{ status: 'success' | 'flagged' | 'error' | 'skipped'; message: string }> {
  if (!profile.avatarUrl) {
    return { status: 'skipped', message: 'No avatarUrl' };
  }

  // Download existing image using the stored path (not a signed URL)
  const imageBuffer = await downloadFile(profile.avatarUrl);
  if (!imageBuffer) {
    return { status: 'error', message: 'Failed to download existing image' };
  }

  // Check original image dimensions to flag low-res sources
  let originalWidth = 0;
  let originalHeight = 0;
  try {
    const metadata = await sharp(imageBuffer).metadata();
    originalWidth = metadata.width || 0;
    originalHeight = metadata.height || 0;
  } catch {
    // Continue even if we can't read metadata
  }

  const isLowRes = originalWidth < 400 || originalHeight < 400;
  const timestamp = Date.now();

  // Generate HQ variant (skip if already exists)
  if (!profile.photoUrlHQ) {
    const hqPath = `${profile.id}/profilePhoto/hq-${timestamp}.webp`;
    const hqBuffer = await sharp(imageBuffer)
      .resize(800, 800, { fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 92 })
      .toBuffer();

    const uploaded = await uploadFile(hqPath, hqBuffer);
    if (!uploaded) {
      return { status: 'error', message: 'Failed to upload HQ variant' };
    }

    await prisma.profile.update({
      where: { id: profile.id },
      data: { photoUrlHQ: hqPath },
    });
  }

  // Generate blur variant (skip if already exists)
  if (!profile.photoBlurDataUrl) {
    const blurBuffer = await sharp(imageBuffer)
      .resize(20, 20, { fit: 'cover' })
      .webp({ quality: 20 })
      .toBuffer();
    const blurDataUrl = `data:image/webp;base64,${blurBuffer.toString('base64')}`;

    await prisma.profile.update({
      where: { id: profile.id },
      data: { photoBlurDataUrl: blurDataUrl },
    });
  }

  if (isLowRes) {
    return {
      status: 'flagged',
      message: `Low-res source (${originalWidth}x${originalHeight}) — user should re-upload`,
    };
  }

  return { status: 'success', message: 'Backfilled successfully' };
}

async function main() {
  console.log('Starting backfill of photo variants...\n');

  // Find profiles that need backfilling
  const profiles = await prisma.profile.findMany({
    where: {
      avatarUrl: { not: null },
      OR: [
        { photoUrlHQ: null },
        { photoBlurDataUrl: null },
      ],
    },
    select: {
      id: true,
      avatarUrl: true,
      photoUrlHQ: true,
      photoBlurDataUrl: true,
    },
  });

  console.log(`Found ${profiles.length} profiles to backfill\n`);

  const results: BackfillResult = { processed: 0, skipped: 0, flagged: 0, errors: 0 };

  for (const profile of profiles) {
    console.log(`Processing profile ${profile.id}...`);
    const result = await backfillProfile(profile);

    if (result.status === 'success') {
      results.processed++;
      console.log(`  ✓ ${result.message}`);
    } else if (result.status === 'flagged') {
      results.flagged++;
      console.log(`  ⚠ ${result.message}`);
    } else if (result.status === 'error') {
      results.errors++;
      console.log(`  ✗ ${result.message}`);
    } else {
      results.skipped++;
      console.log(`  - ${result.message}`);
    }
  }

  console.log('\n--- Backfill Complete ---');
  console.log(`Processed: ${results.processed}`);
  console.log(`Flagged (low-res): ${results.flagged}`);
  console.log(`Errors: ${results.errors}`);
  console.log(`Skipped: ${results.skipped}`);

  if (results.flagged > 0) {
    console.log('\n⚠ Flagged profiles have low-resolution source images.');
    console.log('  The HQ variants were generated but may not be truly high-quality.');
    console.log('  Consider prompting these users to re-upload a fresh photo.');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
