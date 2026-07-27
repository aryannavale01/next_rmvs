import { z } from 'zod';

const genderEnum = z.enum(['male', 'female', 'transgender', 'other']);
const maritalStatusEnum = z.enum(['single', 'married', 'divorced', 'widowed', 'separated']);
const occupationEnum = z.enum([
  'student', 'farmer', 'labour', 'self_employed', 'government_service',
  'private_job', 'homemaker', 'unemployed', 'other',
]);
const socialCategoryEnum = z.enum(['general', 'sc', 'st', 'obc', 'nt', 'sbc', 'ews', 'other']);
const profileStatusEnum = z.enum(['active', 'inactive', 'suspended', 'blocked']);
const educationQualificationEnum = z.enum([
  'none', 'primary', 'ssc', 'hsc', 'diploma', 'iti',
  'graduate', 'post_graduate', 'doctorate',
]);

const beneficiaryAddressSchema = z.object({
  village: z.string().optional(),
  taluka: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits').optional(),
  assemblyConstituency: z.string().optional(),
  parliamentConstituency: z.string().optional(),
});

const beneficiaryDetailSchema = z.object({
  religion: z.string().optional(),
  maritalStatus: maritalStatusEnum.optional(),
  occupation: occupationEnum.optional(),
  annualIncome: z.string().optional(),
  disability: z.string().optional(),
  bloodGroup: z.string().optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  emergencyContact: z.string().optional(),
  guardian: z.string().optional(),
  category: socialCategoryEnum.optional(),
  rationCard: z.string().optional(),
  educationQualification: educationQualificationEnum.optional(),
  educationSchool: z.string().optional(),
  educationCollege: z.string().optional(),
  educationPassingYear: z.number().int().min(1900).max(2100).optional(),
  educationMarks: z.string().optional(),
});

export const createMemberSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(/^(\+91-)?[6-9]\d{9}$/, 'Invalid Indian phone number (expected +91-XXXXXXXXXX or 10-digit starting with 6-9)')
    .optional(),
  gender: genderEnum.optional(),
  dob: z.coerce.date().optional(),
  aadhaarNumber: z
    .string()
    .regex(/^(\d{4}-\d{4}-\d{4}|\d{12})$/, 'Aadhaar must be 12 digits (XXXX-XXXX-XXXX or plain)')
    .optional(),
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (expected ABCDE1234F)')
    .optional(),
  addressLine1: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits').optional(),
  qualification: z.string().optional(),
  assignedVolunteer: z.string().optional(),
  fieldOfficer: z.string().optional(),
  coordinator: z.string().optional(),
  region: z.string().optional(),
  status: profileStatusEnum.default('active'),
  beneficiaryDetail: beneficiaryDetailSchema.optional(),
  beneficiaryAddresses: z.array(beneficiaryAddressSchema).optional(),
})
  .refine(
    (data) => {
      if (!data.dob) return true;
      return data.dob < new Date();
    },
    { message: 'Date of birth must be in the past', path: ['dob'] },
  )
  .refine(
    (data) => {
      if (!data.dob) return true;
      const age = Math.floor((Date.now() - data.dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return age >= 0;
    },
    { message: 'Date of birth must result in age >= 0', path: ['dob'] },
  );

export const updateMemberSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z
    .string()
    .regex(/^(\+91-)?[6-9]\d{9}$/, 'Invalid Indian phone number')
    .optional(),
  gender: genderEnum.optional(),
  dob: z.coerce.date().optional(),
  aadhaarNumber: z
    .string()
    .regex(/^(\d{4}-\d{4}-\d{4}|\d{12})$/, 'Aadhaar must be 12 digits (XXXX-XXXX-XXXX or plain)')
    .optional(),
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format')
    .optional(),
  addressLine1: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits').optional(),
  qualification: z.string().optional(),
  assignedVolunteer: z.string().optional(),
  fieldOfficer: z.string().optional(),
  coordinator: z.string().optional(),
  region: z.string().optional(),
  adminNotes: z.string().optional(),
  beneficiaryDetail: beneficiaryDetailSchema.optional(),
  beneficiaryAddresses: z.array(beneficiaryAddressSchema).optional(),
})
  .refine(
    (data) => {
      if (!data.dob) return true;
      return data.dob < new Date();
    },
    { message: 'Date of birth must be in the past', path: ['dob'] },
  );

export const updateMemberStatusSchema = z.object({
  status: profileStatusEnum,
  reason: z.string().optional(),
});

export const reviewDocumentSchema = z
  .object({
    action: z.enum(['verify', 'reject']),
    rejectionReason: z.string().min(1, 'Rejection reason is required').optional(),
  })
  .refine(
    (data) => data.action !== 'reject' || (data.rejectionReason && data.rejectionReason.length > 0),
    { message: 'Rejection reason is required when rejecting a document', path: ['rejectionReason'] },
  );

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type UpdateMemberStatusInput = z.infer<typeof updateMemberStatusSchema>;
export type ReviewDocumentInput = z.infer<typeof reviewDocumentSchema>;
