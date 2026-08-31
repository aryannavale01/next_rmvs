import { z } from 'zod';

export const createTestimonialSchema = z.object({
  profileId: z.string().optional().nullable(),
  courseId: z.string().optional().nullable(),
  initials: z.string().optional().nullable(),
  name: z.string().min(1, 'Name is required'),
  role: z.string().optional().nullable(),
  quote: z.string().min(1, 'Quote is required'),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  avatarUrl: z.string().url('Avatar must be a valid URL').optional().nullable(),
});

export const updateTestimonialSchema = z.object({
  profileId: z.string().optional().nullable(),
  courseId: z.string().optional().nullable(),
  initials: z.string().optional().nullable(),
  name: z.string().min(1).optional(),
  role: z.string().optional().nullable(),
  quote: z.string().min(1).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  avatarUrl: z.string().url('Avatar must be a valid URL').optional().nullable(),
});

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
