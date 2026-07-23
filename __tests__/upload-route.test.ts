import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectFileType } from '../lib/file-validation';
import { BUCKETS, buildStoragePath } from '../lib/upload-config';

// Mock all external dependencies
vi.mock('@/lib/session', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    beneficiaryDocument: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/supabase-storage', () => ({
  uploadFile: vi.fn().mockResolvedValue({ path: 'test/path.webp' }),
  generateSignedUrl: vi.fn().mockResolvedValue('https://signed.example.com/file.webp'),
  deleteFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed-webp-data')),
  })),
}));

import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { uploadFile, generateSignedUrl, deleteFile } from '@/lib/supabase-storage';
import { POST, DELETE } from '@/app/api/upload/route';

function makeRequest(options: {
  method?: string;
  body?: FormData;
  url?: string;
  headers?: Record<string, string>;
} = {}): Request {
  const url = options.url || 'http://localhost:3000/api/upload';
  return new Request(url, {
    method: options.method || 'POST',
    body: options.body,
    headers: options.headers || {},
  });
}

function makeFormData(file: File | null, documentType: string, profileId?: string): FormData {
  const fd = new FormData();
  if (file) fd.append('file', file);
  fd.append('documentType', documentType);
  if (profileId) fd.append('profileId', profileId);
  return fd;
}

function makeValidJpegFile(size = 1024): File {
  const buf = Buffer.alloc(size);
  buf[0] = 0xFF; buf[1] = 0xD8; buf[2] = 0xFF; // JPEG header
  return new File([buf], 'photo.jpg', { type: 'image/jpeg' });
}

function makeValidPdfFile(size = 1024): File {
  const buf = Buffer.alloc(size);
  buf[0] = 0x25; buf[1] = 0x50; buf[2] = 0x44; buf[3] = 0x46; // %PDF
  return new File([buf], 'doc.pdf', { type: 'application/pdf' });
}

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no session', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ success: false, error: 'Unauthorized' });

    const req = makeRequest({ body: makeFormData(makeValidJpegFile(), 'aadhaar') });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it('returns 400 when no file provided', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      success: true,
      session: { user: { id: 'user-1', email: 'a@b.com', name: 'Test', role: 'ADMIN' }, session: { id: 's1', expiresAt: new Date() } },
    });

    const fd = new FormData();
    fd.append('documentType', 'aadhaar');
    const req = makeRequest({ body: fd });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('No file');
  });

  it('returns 400 for invalid document type', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      success: true,
      session: { user: { id: 'user-1', email: 'a@b.com', name: 'Test', role: 'ADMIN' }, session: { id: 's1', expiresAt: new Date() } },
    });

    const req = makeRequest({ body: makeFormData(makeValidJpegFile(), 'invalid-type') });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Invalid document type');
  });

  it('returns 403 when client profileId mismatches session user', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      success: true,
      session: { user: { id: 'user-1', email: 'a@b.com', name: 'Test', role: 'ADMIN' }, session: { id: 's1', expiresAt: new Date() } },
    });

    const req = makeRequest({
      body: makeFormData(makeValidJpegFile(), 'aadhaar', 'other-user-id'),
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('mismatch');
  });

  it('uploads valid JPEG image successfully', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      success: true,
      session: { user: { id: 'user-1', email: 'a@b.com', name: 'Test', role: 'ADMIN' }, session: { id: 's1', expiresAt: new Date() } },
    });
    vi.mocked(prisma.beneficiaryDocument.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.beneficiaryDocument.create).mockResolvedValue({} as any);

    const req = makeRequest({ body: makeFormData(makeValidJpegFile(2048), 'aadhaar') });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(uploadFile).toHaveBeenCalledWith(
      BUCKETS.aadhaar,
      expect.stringContaining('user-1/aadhaar/'),
      expect.any(Buffer),
      'image/webp',
    );

    const json = await res.json();
    expect(json.signedUrl).toBeTruthy();
    expect(json.storagePath).toBeTruthy();
  });

  it('uploads valid PDF without sharp processing', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      success: true,
      session: { user: { id: 'user-1', email: 'a@b.com', name: 'Test', role: 'ADMIN' }, session: { id: 's1', expiresAt: new Date() } },
    });
    vi.mocked(prisma.beneficiaryDocument.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.beneficiaryDocument.create).mockResolvedValue({} as any);

    const req = makeRequest({ body: makeFormData(makeValidPdfFile(4096), 'pan') });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(uploadFile).toHaveBeenCalledWith(
      BUCKETS.pan,
      expect.stringContaining('user-1/pan/'),
      expect.any(Buffer),
      'application/pdf',
    );

    const json = await res.json();
    expect(json.signedUrl).toBeTruthy();
  });

  it('returns 400 for oversized file before any processing', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      success: true,
      session: { user: { id: 'user-1', email: 'a@b.com', name: 'Test', role: 'ADMIN' }, session: { id: 's1', expiresAt: new Date() } },
    });

    // 11MB JPEG
    const bigFile = makeValidJpegFile(11 * 1024 * 1024);
    const req = makeRequest({ body: makeFormData(bigFile, 'aadhaar') });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it('deletes old file when replacing', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      success: true,
      session: { user: { id: 'user-1', email: 'a@b.com', name: 'Test', role: 'ADMIN' }, session: { id: 's1', expiresAt: new Date() } },
    });
    // Existing doc with a file — DB stores raw path without bucket prefix
    vi.mocked(prisma.beneficiaryDocument.findFirst)
      .mockResolvedValueOnce({ id: 'doc-1', fileUrl: 'user-1/aadhaar/12345.webp' } as any) // existing lookup
      .mockResolvedValueOnce({ id: 'doc-1' } as any); // upsert lookup
    vi.mocked(prisma.beneficiaryDocument.update).mockResolvedValue({} as any);

    const req = makeRequest({ body: makeFormData(makeValidJpegFile(), 'aadhaar') });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(deleteFile).toHaveBeenCalledWith(BUCKETS.aadhaar, 'user-1/aadhaar/12345.webp');
  });
});

describe('DELETE /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no session', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ success: false, error: 'Unauthorized' });

    const req = makeRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/upload?documentType=profilePhoto',
    });
    const res = await DELETE(req);

    expect(res.status).toBe(401);
    expect(deleteFile).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid document type', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      success: true,
      session: { user: { id: 'user-1', email: 'a@b.com', name: 'Test', role: 'ADMIN' }, session: { id: 's1', expiresAt: new Date() } },
    });

    const req = makeRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/upload?documentType=invalid',
    });
    const res = await DELETE(req);

    expect(res.status).toBe(400);
  });

  it('returns 404 when file not found', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      success: true,
      session: { user: { id: 'user-1', email: 'a@b.com', name: 'Test', role: 'ADMIN' }, session: { id: 's1', expiresAt: new Date() } },
    });
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({ avatarUrl: null } as any);

    const req = makeRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/upload?documentType=profilePhoto',
    });
    const res = await DELETE(req);

    expect(res.status).toBe(404);
    expect(deleteFile).not.toHaveBeenCalled();
  });

  it('deletes profile photo and clears DB', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      success: true,
      session: { user: { id: 'user-1', email: 'a@b.com', name: 'Test', role: 'ADMIN' }, session: { id: 's1', expiresAt: new Date() } },
    });
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      avatarUrl: 'user-1/profilePhoto/12345.webp',
    } as any);
    vi.mocked(prisma.profile.update).mockResolvedValue({} as any);

    const req = makeRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/upload?documentType=profilePhoto',
    });
    const res = await DELETE(req);

    expect(res.status).toBe(200);
    expect(deleteFile).toHaveBeenCalledWith(BUCKETS.profilePhoto, 'user-1/profilePhoto/12345.webp');
    expect(prisma.profile.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { avatarUrl: null },
    });
  });

  it('returns 404 when document record not owned by user', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      success: true,
      session: { user: { id: 'user-1', email: 'a@b.com', name: 'Test', role: 'ADMIN' }, session: { id: 's1', expiresAt: new Date() } },
    });
    // findFirst returns null — record doesn't belong to this user
    vi.mocked(prisma.beneficiaryDocument.findFirst).mockResolvedValue(null);

    const req = makeRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/upload?documentType=aadhaar&recordId=doc-999',
    });
    const res = await DELETE(req);

    expect(res.status).toBe(404);
    expect(deleteFile).not.toHaveBeenCalled();
  });
});

describe('buildStoragePath', () => {
  it('generates path with userId, documentType, and timestamp', () => {
    const path = buildStoragePath('user-123', 'aadhaar', 'webp');
    expect(path).toMatch(/^user-123\/aadhaar\/\d+\.webp$/);
  });

  it('generates path for PDF', () => {
    const path = buildStoragePath('user-456', 'pan', 'pdf');
    expect(path).toMatch(/^user-456\/pan\/\d+\.pdf$/);
  });
});

describe('BUCKETS', () => {
  it('has all required buckets', () => {
    expect(BUCKETS.profilePhoto).toBe('profile-photos');
    expect(BUCKETS.aadhaar).toBe('aadhaar-docs');
    expect(BUCKETS.pan).toBe('pan-docs');
    expect(BUCKETS.rationCard).toBe('ration-docs');
  });
});
