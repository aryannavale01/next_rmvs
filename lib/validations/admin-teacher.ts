import { z } from 'zod';

const teacherTypeEnum = z.enum(['trainer', 'volunteer', 'guest_faculty']);
const teacherStatusEnum = z.enum(['active', 'inactive', 'on_leave', 'resigned']);

export const createTeacherSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  mobile: z
    .string()
    .regex(/^(\+91-)?[6-9]\d{9}$/, 'Invalid Indian phone number (expected +91-XXXXXXXXXX or 10-digit starting with 6-9)'),
  designation: z.string().min(1, 'Designation is required'),
  qualification: z.string().optional(),
  specializations: z.array(z.string()).optional().default([]),
  experienceYears: z.number().int().nonnegative('Experience must be a non-negative integer').optional(),
  village: z.string().optional(),
  taluka: z.string().optional(),
  district: z.string().optional(),
  state: z.string().default('Maharashtra'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits').optional(),
  teacherType: teacherTypeEnum.default('trainer'),
  status: teacherStatusEnum.default('active'),
  joinedDate: z.coerce.date().refine(d => !isNaN(d.getTime()), { message: 'Join date is required' }),
  bio: z.string().optional(),
});

// True-partial update schema: unlike createTeacherSchema.partial(), no .default() here —
// otherwise a { status }-only PATCH would silently reset teacherType/state to their defaults.
export const updateTeacherSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  mobile: z
    .string()
    .regex(/^(\+91-)?[6-9]\d{9}$/, 'Invalid Indian phone number (expected +91-XXXXXXXXXX or 10-digit starting with 6-9)')
    .optional(),
  designation: z.string().min(1, 'Designation is required').optional(),
  qualification: z.string().nullable().optional(),
  specializations: z.array(z.string()).optional(),
  experienceYears: z.number().int().nonnegative('Experience must be a non-negative integer').nullable().optional(),
  village: z.string().nullable().optional(),
  taluka: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  state: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits').nullable().optional(),
  teacherType: teacherTypeEnum.optional(),
  status: teacherStatusEnum.optional(),
  joinedDate: z.coerce.date().refine(d => !isNaN(d.getTime()), { message: 'Invalid join date' }).optional(),
  bio: z.string().nullable().optional(),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
