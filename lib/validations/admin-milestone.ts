import { z } from 'zod';

export const createMilestoneSchema = z.object({
  year: z.coerce.number().int().min(1900).max(2100),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
});

export const updateMilestoneSchema = z.object({
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
