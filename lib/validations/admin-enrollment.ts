import { z } from "zod/v4";

export const ApplicationStatusSchema = z.enum([
  "pending",
  "under_review",
  "documents_verified",
  "seat_reserved",
  "waitlisted",
  "rejected",
  "deleted",
]);

export const EnrollmentStatusSchema = z.enum([
  "enrolled",
  "in_progress",
  "completed",
  "dropped",
  "certified",
]);

export const EnrollmentSortField = z.enum([
  "appliedDate",
  "status",
  "course",
  "member",
  "waitlistedAt",
]);

export const EnrollmentSortOrder = z.enum(["asc", "desc"]);

export const EnrollmentFiltersSchema = z.object({
  courseId: z.string().optional(),
  status: ApplicationStatusSchema.optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sort: EnrollmentSortField.default("appliedDate"),
  order: EnrollmentSortOrder.default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const PatchApplicationSchema = z.object({
  status: ApplicationStatusSchema.optional(),
  reviewNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  documentAction: z.object({
    documentType: z.string(),
    action: z.enum(["verify", "reject"]),
  }).optional(),
});

export const BulkActionSchema = z.object({
  action: z.enum(["approve", "waitlist", "reject", "convert", "promote", "move_to_review", "remove", "bulk_drop", "bulk_complete"]),
  applicationIds: z.array(z.string().uuid()).min(1).max(100).optional(),
  enrollmentIds: z.array(z.string().uuid()).min(1).max(100).optional(),
}).refine(
  (data) => (data.applicationIds && data.applicationIds.length > 0) || (data.enrollmentIds && data.enrollmentIds.length > 0),
  { message: "At least one applicationIds or enrollmentIds required" },
);

export const EnrollmentExportSchema = z.object({
  courseId: z.string().optional(),
  status: ApplicationStatusSchema.optional(),
  format: z.enum(["csv", "pdf", "docx", "json-rich"]).default("csv"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const AdminNoteCreateSchema = z.object({
  text: z.string().min(1).max(2000),
});

export const PatchEnrollmentSchema = z.object({
  status: z.enum(["dropped", "completed"]).optional(),
  batchLabel: z.string().max(100).optional(),
  seatNumber: z.number().int().positive().optional(),
});

export type EnrollmentFilters = z.infer<typeof EnrollmentFiltersSchema>;
export type PatchApplication = z.infer<typeof PatchApplicationSchema>;
export type BulkAction = z.infer<typeof BulkActionSchema>;
export type EnrollmentExport = z.infer<typeof EnrollmentExportSchema>;
export type AdminNoteCreate = z.infer<typeof AdminNoteCreateSchema>;
export type PatchEnrollment = z.infer<typeof PatchEnrollmentSchema>;
