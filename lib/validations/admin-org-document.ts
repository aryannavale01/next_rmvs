import { z } from 'zod';

export const ORG_DOCUMENT_TYPES = [
  'NGO_REGISTRATION_CERTIFICATE',
  'PAN_CARD',
  'TAN_CARD',
  'NITI_AAYOG_REGISTRATION',
  'CSR1',
  'ANNUAL_REPORT',
  'WORK_ORDER',
  'ORG_PROFILE',
  'CERTIFICATE_12A',
  'CERTIFICATE_80G',
] as const;

export type OrgDocumentTypeValue = (typeof ORG_DOCUMENT_TYPES)[number];

export const createOrgDocumentSchema = z.object({
  type: z.enum(ORG_DOCUMENT_TYPES),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  year: z.coerce.number().int().min(2000, 'Year must be 2000 or later').max(2100).optional(),
  isPublic: z.coerce.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
});

export const updateOrgDocumentSchema = createOrgDocumentSchema.partial();
