import { z } from 'zod';

const locationTypeEnum = z.enum(['hub', 'office']);

export const createLocationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().optional().nullable(),
  type: locationTypeEnum.default('office'),
  coordinator: z.string().optional().nullable(),
  staffCount: z.coerce.number().int().nonnegative().optional().nullable(),
  activePrograms: z.array(z.string()).optional().default([]),
  contactEmail: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  coordinates: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional().nullable(),
  type: locationTypeEnum.optional(),
  coordinator: z.string().optional().nullable(),
  staffCount: z.coerce.number().int().nonnegative().optional().nullable(),
  activePrograms: z.array(z.string()).optional(),
  contactEmail: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  coordinates: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
