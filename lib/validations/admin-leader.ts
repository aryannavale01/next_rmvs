import { z } from 'zod';

export const createLeaderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  image: z.string().url('Image must be a valid URL').optional().nullable(),
  department: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  quote: z.string().optional().nullable(),
});

export const updateLeaderSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  image: z.string().url('Image must be a valid URL').optional().nullable(),
  department: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  quote: z.string().optional().nullable(),
});

export type CreateLeaderInput = z.infer<typeof createLeaderSchema>;
export type UpdateLeaderInput = z.infer<typeof updateLeaderSchema>;
