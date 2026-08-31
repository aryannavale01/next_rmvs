export const BUCKETS = {
  profilePhoto: 'profile-photos',
  aadhaar: 'aadhaar-docs',
  pan: 'pan-docs',
  rationCard: 'ration-docs',
  cmsImages: 'cms-images',
} as const;

export type DocumentType = keyof typeof BUCKETS;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for documents
export const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB for profile photos

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_PDF_TYPES = ['application/pdf'] as const;
export const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_PDF_TYPES] as const;

// Magic-byte signatures — these are the actual binary values, not hex strings.
// WebP requires checking BOTH bytes 0-3 (RIFF) AND bytes 8-11 (WEBP) because
// RIFF is shared by WAV, AVI, and other formats.
export const MAGIC_BYTES = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png:  [0x89, 0x50, 0x4E, 0x47],
  webp: {
    header: [0x52, 0x49, 0x46, 0x46],  // bytes 0-3: "RIFF"
    format: [0x57, 0x45, 0x42, 0x50],  // bytes 8-11: "WEBP"
  },
  pdf:  [0x25, 0x50, 0x44, 0x46],      // "%PDF"
} as const;

// Sharp resize settings for images
export const IMAGE_PROCESSING = {
  width: 1600,
  height: 1600,
  fit: 'inside' as const,
  withoutEnlargement: true,
  quality: 75,
} as const;

// Max upload size for CMS gallery/content images (10MB)
export const MAX_CMS_IMAGE_SIZE = 10 * 1024 * 1024;

// Sharp processing for CMS images (optimized WebP, wide enough for hero/covers)
export const CMS_IMAGE_PROCESSING = {
  width: 2000,
  height: 2000,
  fit: 'inside' as const,
  withoutEnlargement: true,
  quality: 82,
} as const;

// Signed URL expiry for display (1 hour)
export const SIGNED_URL_EXPIRY = 3600;

// Build a deterministic, safe storage path — no original filename.
// Format: {userId}/{documentType}/{timestamp}.{ext}
export function buildStoragePath(
  userId: string,
  documentType: string,
  extension: string,
): string {
  return `${userId}/${documentType}/${Date.now()}.${extension}`;
}
