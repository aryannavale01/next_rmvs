import { z } from 'zod';

export const createGalleryItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  image: z.string().url('Image must be a valid URL').optional().nullable(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  loggedDate: z.string().optional().nullable(),
  isVideo: z.coerce.boolean().optional().default(false),
});

export const updateGalleryItemSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  image: z.string().url('Image must be a valid URL').optional().nullable(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  loggedDate: z.string().optional().nullable(),
  isVideo: z.coerce.boolean().optional(),
});

export type CreateGalleryItemInput = z.infer<typeof createGalleryItemSchema>;
export type UpdateGalleryItemInput = z.infer<typeof updateGalleryItemSchema>;
