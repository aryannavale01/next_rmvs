import { describe, it, expect } from 'vitest';
import { detectFileType, validateFile, fileTypeToExtension } from '../lib/file-validation';

function makeBuffer(...bytes: number[]): Buffer {
  return Buffer.from(bytes);
}

describe('detectFileType', () => {
  it('detects JPEG from FF D8 FF header', () => {
    const buf = Buffer.alloc(16);
    buf[0] = 0xFF; buf[1] = 0xD8; buf[2] = 0xFF; buf[3] = 0xE0;
    expect(detectFileType(buf)).toBe('jpeg');
  });

  it('detects PNG from 89 50 4E 47 header', () => {
    // Must be at least 12 bytes (safety check for WebP detection)
    const buf = makeBuffer(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x00);
    expect(detectFileType(buf)).toBe('png');
  });

  it('detects WebP from RIFF + WEBP signature', () => {
    // RIFF....WEBP
    const buf = makeBuffer(
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x00, 0x00, 0x00, 0x00, // file size (ignored)
      0x57, 0x45, 0x42, 0x50, // "WEBP"
    );
    expect(detectFileType(buf)).toBe('webp');
  });

  it('rejects WAV file (RIFF + WAVE) as not WebP', () => {
    // RIFF....WAVE
    const buf = makeBuffer(
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x00, 0x00, 0x00, 0x00, // file size
      0x57, 0x41, 0x56, 0x45, // "WAVE"
    );
    expect(detectFileType(buf)).toBeNull();
  });

  it('rejects AVI file (RIFF + AVI ) as not WebP', () => {
    // RIFF....AVI 
    const buf = makeBuffer(
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x00, 0x00, 0x00, 0x00,
      0x41, 0x56, 0x49, 0x20, // "AVI "
    );
    expect(detectFileType(buf)).toBeNull();
  });

  it('detects PDF from %PDF header', () => {
    // %PDF-1.4 — must be at least 12 bytes
    const buf = makeBuffer(0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x00, 0x00, 0x00, 0x00);
    expect(detectFileType(buf)).toBe('pdf');
  });

  it('returns null for unrecognized bytes', () => {
    const buf = makeBuffer(0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B);
    expect(detectFileType(buf)).toBeNull();
  });

  it('returns null for buffer shorter than 12 bytes', () => {
    const buf = makeBuffer(0xFF, 0xD8, 0xFF);
    expect(detectFileType(buf)).toBeNull();
  });

  it('rejects renamed .txt file with random content', () => {
    // "Hello World!" in ASCII
    const buf = Buffer.from('Hello World! This is a text file, not an image.');
    expect(detectFileType(buf)).toBeNull();
  });

  it('rejects renamed .exe with MZ header', () => {
    const buf = makeBuffer(0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00);
    expect(detectFileType(buf)).toBeNull();
  });
});

describe('fileTypeToExtension', () => {
  it('returns correct extensions', () => {
    expect(fileTypeToExtension('jpeg')).toBe('jpg');
    expect(fileTypeToExtension('png')).toBe('png');
    expect(fileTypeToExtension('webp')).toBe('webp');
    expect(fileTypeToExtension('pdf')).toBe('pdf');
  });
});

describe('validateFile', () => {
  function makeJpegBuffer(size: number): Buffer {
    const buf = Buffer.alloc(size);
    buf[0] = 0xFF; buf[1] = 0xD8; buf[2] = 0xFF; // JPEG header
    return buf;
  }

  function makePdfBuffer(size: number): Buffer {
    const buf = Buffer.alloc(size);
    buf[0] = 0x25; buf[1] = 0x50; buf[2] = 0x44; buf[3] = 0x46; // %PDF
    return buf;
  }

  it('accepts valid JPEG for aadhaar', () => {
    const result = validateFile(makeJpegBuffer(1000), 'aadhaar');
    expect(result.valid).toBe(true);
    expect(result.fileType).toBe('jpeg');
  });

  it('accepts valid PDF for aadhaar', () => {
    const result = validateFile(makePdfBuffer(1000), 'aadhaar');
    expect(result.valid).toBe(true);
    expect(result.fileType).toBe('pdf');
  });

  it('accepts valid PDF for pan', () => {
    const result = validateFile(makePdfBuffer(1000), 'pan');
    expect(result.valid).toBe(true);
    expect(result.fileType).toBe('pdf');
  });

  it('accepts valid PDF for rationCard', () => {
    const result = validateFile(makePdfBuffer(1000), 'rationCard');
    expect(result.valid).toBe(true);
    expect(result.fileType).toBe('pdf');
  });

  it('rejects PDF for profilePhoto', () => {
    const result = validateFile(makePdfBuffer(1000), 'profilePhoto');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('images');
  });

  it('rejects file exceeding 10MB limit for documents', () => {
    const buf = makeJpegBuffer(11 * 1024 * 1024);
    const result = validateFile(buf, 'aadhaar');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('10MB');
  });

  it('rejects file exceeding 2MB limit for profile photos', () => {
    const buf = makeJpegBuffer(3 * 1024 * 1024);
    const result = validateFile(buf, 'profilePhoto');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('2MB');
  });

  it('rejects unrecognized file type', () => {
    const buf = Buffer.alloc(100);
    buf[0] = 0x00; buf[1] = 0x01;
    const result = validateFile(buf, 'aadhaar');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unsupported');
  });
});
