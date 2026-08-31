import { z } from 'zod';

const visibilityEnum = z.enum(['homepage', 'programs', 'both']);

export const createProgramSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  goal: z.coerce.number().nonnegative().optional().default(0),
  raised: z.coerce.number().nonnegative().optional().default(0),
  image: z.string().url('Image must be a valid URL').optional().nullable(),
  isStrategic: z.coerce.boolean().optional().default(false),
  visibility: visibilityEnum.default('both'),
});

export const updateProgramSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  goal: z.coerce.number().nonnegative().optional(),
  raised: z.coerce.number().nonnegative().optional(),
  image: z.string().url('Image must be a valid URL').optional().nullable(),
  isStrategic: z.coerce.boolean().optional(),
  visibility: visibilityEnum.optional(),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;
