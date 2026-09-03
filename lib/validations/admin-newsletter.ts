import { z } from 'zod';
import { sanitizeHtmlContent } from '@/lib/sanitize-html';

const sanitizeBody = (v: string | null | undefined) =>
  v == null ? v : sanitizeHtmlContent(v);

export const createNewsletterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().optional().nullable().transform((v) => sanitizeBody(v)),
  date: z.coerce.date().optional().nullable(),
  readTime: z.string().optional().nullable(),
  image: z.string().url('Image must be a valid URL').optional().nullable(),
  fileUrl: z.string().url('File URL must be valid').optional().nullable(),
});

export const updateNewsletterSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().optional().nullable().transform((v) => sanitizeBody(v)),
  date: z.coerce.date().optional().nullable(),
  readTime: z.string().optional().nullable(),
  image: z.string().url('Image must be a valid URL').optional().nullable(),
  fileUrl: z.string().url('File URL must be valid').optional().nullable(),
});

export type CreateNewsletterInput = z.infer<typeof createNewsletterSchema>;
export type UpdateNewsletterInput = z.infer<typeof updateNewsletterSchema>;
