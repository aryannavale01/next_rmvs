import { MAGIC_BYTES, MAX_FILE_SIZE, MAX_PHOTO_SIZE, BUCKETS, type DocumentType } from './upload-config';

export type FileType = 'jpeg' | 'png' | 'webp' | 'pdf';

function matchBytes(buffer: Uint8Array, pattern: readonly number[], offset: number): boolean {
  for (let i = 0; i < pattern.length; i++) {
    if (buffer[offset + i] !== pattern[i]) return false;
  }
  return true;
}

/**
 * Detect file type from magic bytes in the buffer.
 * Returns null for unrecognized types.
 *
 * WebP detection checks BOTH RIFF header (bytes 0-3) AND WEBP format identifier
 * (bytes 8-11) to avoid false positives on WAV, AVI, and other RIFF-based formats.
 */
export function detectFileType(buffer: Buffer): FileType | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (matchBytes(buffer, MAGIC_BYTES.jpeg, 0)) return 'jpeg';

  // PNG: 89 50 4E 47
  if (matchBytes(buffer, MAGIC_BYTES.png, 0)) return 'png';

  // WebP: RIFF....WEBP (bytes 0-3 + bytes 8-11)
  if (
    matchBytes(buffer, MAGIC_BYTES.webp.header, 0) &&
    matchBytes(buffer, MAGIC_BYTES.webp.format, 8)
  ) return 'webp';

  // PDF: %PDF-
  if (matchBytes(buffer, MAGIC_BYTES.pdf, 0)) return 'pdf';

  return null;
}

/**
 * Map detected file type to the correct file extension for storage.
 */
export function fileTypeToExtension(type: FileType): string {
  switch (type) {
    case 'jpeg': return 'jpg';
    case 'png': return 'png';
    case 'webp': return 'webp';
    case 'pdf': return 'pdf';
  }
}

/**
 * Map detected file type to the MIME type for Supabase Storage.
 */
export function fileTypeToMime(type: FileType): string {
  switch (type) {
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'pdf': return 'application/pdf';
  }
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  fileType?: FileType;
}

/**
 * Validate a file buffer against size limits and magic-byte checks.
 *
 * For profilePhoto: only images allowed (jpeg/png/webp), 2MB limit.
 * For document types (aadhaar/pan/rationCard): images or PDF, 10MB limit.
 *
 * Validates buffer content, NOT file extension or Content-Type header.
 */
export function validateFile(buffer: Buffer, documentType: DocumentType): ValidationResult {
  const isPhoto = documentType === 'profilePhoto';
  const maxSize = isPhoto ? MAX_PHOTO_SIZE : MAX_FILE_SIZE;

  if (buffer.length > maxSize) {
    const limitMB = Math.round(maxSize / (1024 * 1024));
    return { valid: false, error: `File exceeds ${limitMB}MB limit` };
  }

  const fileType = detectFileType(buffer);
  if (!fileType) {
    return { valid: false, error: 'Unsupported file type' };
  }

  if (isPhoto && fileType === 'pdf') {
    return { valid: false, error: 'Profile photos must be images (JPEG, PNG, or WebP)' };
  }

  return { valid: true, fileType };
}
