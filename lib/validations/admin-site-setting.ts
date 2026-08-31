import { z } from 'zod';

export const upsertSiteSettingSchema = z.object({
  key: z.string().min(1, 'Key is required').max(100),
  value: z.string().min(1, 'Value is required'),
  label: z.string().min(1, 'Label is required'),
  category: z.string().min(1, 'Category is required'),
});

export const updateSiteSettingSchema = z.object({
  value: z.string().min(1, 'Value is required').optional(),
  label: z.string().min(1, 'Label is required').optional(),
  category: z.string().min(1, 'Category is required').optional(),
});

export type UpsertSiteSettingInput = z.infer<typeof upsertSiteSettingSchema>;
export type UpdateSiteSettingInput = z.infer<typeof updateSiteSettingSchema>;
