import { z } from 'zod';

export const createBlogPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  readTime: z.string().optional().nullable(),
  date: z.coerce.date().optional().nullable(),
  image: z.string().url('Image must be a valid URL').optional().nullable(),
  author: z.string().optional().nullable(),
});

export const updateBlogPostSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  readTime: z.string().optional().nullable(),
  date: z.coerce.date().optional().nullable(),
  image: z.string().url('Image must be a valid URL').optional().nullable(),
  author: z.string().optional().nullable(),
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
