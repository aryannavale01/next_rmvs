import { z } from 'zod';

export const createNewsletterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().optional().nullable(),
  date: z.coerce.date().optional().nullable(),
  readTime: z.string().optional().nullable(),
  image: z.string().url('Image must be a valid URL').optional().nullable(),
  fileUrl: z.string().url('File URL must be valid').optional().nullable(),
});

export const updateNewsletterSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().optional().nullable(),
  date: z.coerce.date().optional().nullable(),
  readTime: z.string().optional().nullable(),
  image: z.string().url('Image must be a valid URL').optional().nullable(),
  fileUrl: z.string().url('File URL must be valid').optional().nullable(),
});

export type CreateNewsletterInput = z.infer<typeof createNewsletterSchema>;
export type UpdateNewsletterInput = z.infer<typeof updateNewsletterSchema>;
