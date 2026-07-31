import type { AdminCourse, Coupon, SyllabusLesson } from './admin-types';
import type { CourseCategory, CourseLevel, CourseStatus, DiscountType, LessonType, TrainingMode } from '@prisma/client';

const CATEGORY_MAP_ADMIN_TO_DB: Record<string, CourseCategory> = {
  Agriculture: 'environment',
  Tech: 'tech',
  Healthcare: 'health',
  Business: 'leadership',
};

const CATEGORY_MAP_DB_TO_ADMIN: Record<string, string> = {
  environment: 'Agriculture',
  tech: 'Tech',
  health: 'Healthcare',
  leadership: 'Business',
};

const STATUS_MAP_ADMIN_TO_DB: Record<string, CourseStatus> = {
  Draft: 'draft',
  Published: 'active',
};

const STATUS_MAP_DB_TO_ADMIN: Record<string, string> = {
  draft: 'Draft',
  active: 'Published',
  archived: 'Draft',
};

const MODE_MAP_DB_TO_ADMIN: Record<string, string> = {
  online: 'Online',
  offline: 'Offline',
  hybrid: 'Hybrid',
};

const LESSON_TYPE_MAP_ADMIN_TO_DB: Record<string, LessonType> = {
  Video: 'video',
  Text: 'text',
  Quiz: 'quiz',
  Assignment: 'assignment',
};

const LESSON_TYPE_MAP_DB_TO_ADMIN: Record<string, SyllabusLesson['type']> = {
  video: 'Video',
  text: 'Text',
  quiz: 'Quiz',
  assignment: 'Assignment',
};

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'course';
}

function parseDurationMinutes(duration: string | null | undefined): number | null {
  if (!duration) return null;
  const match = String(duration).trim().toLowerCase().match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const num = Number(match[1]);
  if (Number.isNaN(num)) return null;
  return String(duration).toLowerCase().includes('hr') ? Math.round(num * 60) : Math.round(num);
}

export function mapCouponToAdmin(c: any): Coupon {
  return {
    id: c.id,
    code: c.code,
    description: c.description ?? '',
    discountType: c.discountType,
    discountValue: Number(c.discountValue),
    expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString() : null,
    validFrom: c.validFrom ? new Date(c.validFrom).toISOString() : null,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    perUserLimit: c.perUserLimit,
    minAmount: c.minAmount ? Number(c.minAmount) : null,
    courseId: c.courseId,
    isActive: c.isActive,
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : '',
    updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : '',
  };
}

function mapSyllabusRows(syllabus: any[] = []): SyllabusLesson[] {
  return syllabus
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((s) => ({
      id: s.id,
      title: s.title,
      type: LESSON_TYPE_MAP_DB_TO_ADMIN[s.lessonType] ?? 'Video',
      duration: s.durationMinutes ? `${s.durationMinutes} min` : '',
    }));
}

function mapSyllabusToCreate(syllabus: any[] = []): { title: string; lessonType: LessonType; durationMinutes: number | null; sortOrder: number; isFreePreview: boolean }[] {
  return syllabus.map((s, i) => ({
    title: String(s.title ?? '').trim(),
    lessonType: LESSON_TYPE_MAP_ADMIN_TO_DB[s.type] ?? 'video',
    durationMinutes: parseDurationMinutes(s.duration),
    sortOrder: i,
    isFreePreview: false,
  }));
}

function mapCouponsToCreate(coupons: any[] = []): {
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  expiresAt: Date | null;
  maxUses: number | null;
  perUserLimit: null;
  isActive: boolean;
}[] {
  return coupons.map((c) => ({
    code: String(c.code ?? '').trim().toUpperCase(),
    description: c.description || null,
    discountType: (c.discountType === 'fixed' ? 'fixed' : 'percentage') as DiscountType,
    discountValue: Number(c.discountValue) || 0,
    expiresAt: c.expiresAt ? new Date(c.expiresAt) : null,
    maxUses: c.maxUses ?? 10,
    perUserLimit: null,
    isActive: true,
  }));
}

export function mapCourseToAdminShape(
  c: any,
  stats?: { seatsEnrolled: number; totalApplications: number },
): AdminCourse & { totalApplications: number } {
  return {
    id: c.id,
    title: c.title,
    category: CATEGORY_MAP_DB_TO_ADMIN[c.category] ?? c.category,
    mode: (MODE_MAP_DB_TO_ADMIN[c.mode] ?? c.mode) as AdminCourse['mode'],
    location: c.location ?? '',
    teacher_id: c.teacherId ?? '',
    start_date: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
    end_date: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
    duration: c.duration ?? '',
    seats_total: c.seatsTotal ?? 0,
    seats_enrolled: stats?.seatsEnrolled ?? 0,
    totalApplications: stats?.totalApplications ?? 0,
    access_code_required: c.accessCodeRequired,
    auto_approve: c.autoApprove,
    price: c.price ? Number(c.price) : 0,
    currency: c.currency ?? 'INR',
    coupons: Array.isArray(c.coupons) ? c.coupons.map(mapCouponToAdmin) : [],
    required_docs: c.requiredDocuments ?? [],
    syllabus: Array.isArray(c.syllabus) ? mapSyllabusRows(c.syllabus) : [],
    status: (STATUS_MAP_DB_TO_ADMIN[c.status] ?? 'Draft') as AdminCourse['status'],
    meta_description: c.metaDescription ?? '',
    benefits: c.benefits ?? [],
    eligibility: Array.isArray(c.eligibility) ? c.eligibility.join(', ') : (c.eligibility ?? ''),
  };
}

export function buildPrismaCreateData(body: Record<string, unknown>) {
  const slug = slugify((body.title as string) ?? '');
  return {
    title: body.title as string,
    slug,
    category: (CATEGORY_MAP_ADMIN_TO_DB[body.category as string] ?? body.category) as CourseCategory,
    level: 'beginner' as CourseLevel,
    description: (body.meta_description as string) ?? '',
    duration: (body.duration as string) ?? '',
    mode: ((body.mode as string)?.toLowerCase() ?? 'online') as TrainingMode,
    location: (body.location as string) || null,
    startDate: body.start_date ? new Date(body.start_date as string) : null,
    endDate: body.end_date ? new Date(body.end_date as string) : null,
    seatsTotal: Number(body.seats_total) || null,
    teacherId: (body.teacher_id as string) || null,
    instructorName: (body.instructorName as string) ?? '',
    instructorRole: (body.instructorRole as string) ?? '',
    instructorImage: (body.instructorImage as string) ?? '',
    price: Number(body.price) || 0,
    currency: (body.currency as string) ?? 'INR',
    benefits: Array.isArray(body.benefits) ? (body.benefits as string[]) : [],
    eligibility: typeof body.eligibility === 'string'
      ? (body.eligibility as string).split(',').map((s: string) => s.trim()).filter(Boolean)
      : [],
    requiredDocuments: (body.required_docs as string[]) ?? [],
    accessCodeRequired: Boolean(body.access_code_required),
    autoApprove: Boolean(body.auto_approve),
    status: (STATUS_MAP_ADMIN_TO_DB[body.status as string] ?? 'active') as CourseStatus,
    metaDescription: (body.meta_description as string) || null,
    visibility: 'both',
    syllabus: {
      create: mapSyllabusToCreate(Array.isArray(body.syllabus) ? (body.syllabus as any[]) : []),
    },
    coupons: {
      create: mapCouponsToCreate(Array.isArray(body.coupons) ? (body.coupons as any[]) : []),
    },
  };
}

export function buildPrismaUpdateBody(body: Record<string, unknown>) {
  const updateData: Record<string, unknown> = {};

  if (body.title !== undefined) updateData.title = body.title;
  if (body.category !== undefined) updateData.category = CATEGORY_MAP_ADMIN_TO_DB[body.category as string] ?? body.category;
  if (body.mode !== undefined) updateData.mode = (body.mode as string).toLowerCase();
  if (body.location !== undefined) updateData.location = body.location || null;
  if (body.teacher_id !== undefined) updateData.teacherId = body.teacher_id || null;
  if (body.start_date !== undefined) updateData.startDate = body.start_date ? new Date(body.start_date as string) : null;
  if (body.end_date !== undefined) updateData.endDate = body.end_date ? new Date(body.end_date as string) : null;
  if (body.duration !== undefined) updateData.duration = body.duration;
  if (body.seats_total !== undefined) updateData.seatsTotal = Number(body.seats_total) || null;
  if (body.access_code_required !== undefined) updateData.accessCodeRequired = Boolean(body.access_code_required);
  if (body.auto_approve !== undefined) updateData.autoApprove = Boolean(body.auto_approve);
  if (body.price !== undefined) updateData.price = Number(body.price) || 0;
  if (body.currency !== undefined) updateData.currency = body.currency;
  if (body.required_docs !== undefined) updateData.requiredDocuments = body.required_docs;
  if (body.status !== undefined) updateData.status = STATUS_MAP_ADMIN_TO_DB[body.status as string] ?? body.status;
  if (body.meta_description !== undefined) updateData.metaDescription = body.meta_description || null;
  if (body.benefits !== undefined) updateData.benefits = Array.isArray(body.benefits) ? body.benefits : [];
  if (body.instructorName !== undefined) updateData.instructorName = body.instructorName;
  if (body.instructorRole !== undefined) updateData.instructorRole = body.instructorRole;
  if (body.instructorImage !== undefined) updateData.instructorImage = body.instructorImage;
  if (body.eligibility !== undefined) {
    updateData.eligibility = typeof body.eligibility === 'string'
      ? (body.eligibility as string).split(',').map((s: string) => s.trim()).filter(Boolean)
      : body.eligibility;
  }

  return updateData;
}
