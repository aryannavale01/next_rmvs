import { z } from 'zod';

export const createPartnerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  icon: z.string().default('HeartHandshake'),
});

export const updatePartnerSchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().optional(),
});

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;
export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>;
