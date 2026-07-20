-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('member', 'admin');

-- CreateEnum
CREATE TYPE "profile_status" AS ENUM ('active', 'inactive', 'suspended', 'blocked', 'deleted');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('male', 'female', 'transgender', 'other');

-- CreateEnum
CREATE TYPE "category" AS ENUM ('general', 'sc', 'st', 'obc', 'nt', 'sbc', 'ews', 'other');

-- CreateEnum
CREATE TYPE "marital_status" AS ENUM ('single', 'married', 'divorced', 'widowed', 'separated');

-- CreateEnum
CREATE TYPE "occupation" AS ENUM ('student', 'farmer', 'labour', 'self_employed', 'government_service', 'private_job', 'homemaker', 'unemployed', 'other');

-- CreateEnum
CREATE TYPE "qualification" AS ENUM ('none', 'primary', 'ssc', 'hsc', 'diploma', 'iti', 'graduate', 'post_graduate', 'doctorate');

-- CreateEnum
CREATE TYPE "course_category" AS ENUM ('health', 'tech', 'leadership', 'environment');

-- CreateEnum
CREATE TYPE "course_level" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "training_mode" AS ENUM ('online', 'offline', 'hybrid');

-- CreateEnum
CREATE TYPE "application_status" AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'completed');

-- CreateEnum
CREATE TYPE "enrollment_status" AS ENUM ('enrolled', 'completed', 'dropped');

-- CreateEnum
CREATE TYPE "certificate_status" AS ENUM ('pending', 'approved', 'generated', 'published', 'downloaded', 'revoked');

-- CreateEnum
CREATE TYPE "published_status" AS ENUM ('published', 'unpublished', 'pending');

-- CreateEnum
CREATE TYPE "document_status" AS ENUM ('verified', 'pending', 'rejected', 'not_uploaded');

-- CreateEnum
CREATE TYPE "teacher_status" AS ENUM ('active', 'inactive', 'on_leave', 'resigned');

-- CreateEnum
CREATE TYPE "teacher_type" AS ENUM ('trainer', 'volunteer', 'guest_faculty');

-- CreateEnum
CREATE TYPE "course_visibility" AS ENUM ('homepage', 'programs', 'both');

-- CreateEnum
CREATE TYPE "location_type" AS ENUM ('hub', 'office');

-- CreateEnum
CREATE TYPE "discount_type" AS ENUM ('percentage', 'fixed');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'paid', 'failed', 'refunded', 'waived');

-- CreateEnum
CREATE TYPE "lesson_type" AS ENUM ('video', 'text', 'quiz', 'assignment');

-- CreateEnum
CREATE TYPE "field_type" AS ENUM ('text', 'textarea', 'select', 'multiselect', 'file', 'date', 'boolean');

-- CreateEnum
CREATE TYPE "course_status" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "template_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "request_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "teacher_course_status" AS ENUM ('ongoing', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "gender" "gender",
    "dob" DATE,
    "role" "user_role" NOT NULL DEFAULT 'member',
    "aadhaar_number" TEXT,
    "pan_number" TEXT,
    "address_line1" TEXT,
    "district" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "qualification" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "profile_completion" INTEGER NOT NULL DEFAULT 0,
    "verification_score" INTEGER NOT NULL DEFAULT 0,
    "status" "profile_status" NOT NULL DEFAULT 'active',
    "registration_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),
    "assigned_volunteer" TEXT,
    "field_officer" TEXT,
    "coordinator" TEXT,
    "region" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiary_details" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "religion" TEXT,
    "marital_status" "marital_status",
    "occupation" "occupation",
    "annual_income" TEXT,
    "disability" TEXT,
    "blood_group" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emergency_contact" TEXT,
    "guardian" TEXT,
    "category" "category",
    "ration_card" TEXT,
    "education_qualification" "qualification",
    "education_school" TEXT,
    "education_college" TEXT,
    "education_passing_year" INTEGER,
    "education_marks" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiary_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiary_addresses" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "village" TEXT,
    "taluka" TEXT,
    "district" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "assembly_constituency" TEXT,
    "parliament_constituency" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beneficiary_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiary_documents" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "file_url" TEXT,
    "status" "document_status" NOT NULL DEFAULT 'not_uploaded',
    "uploaded_date" TIMESTAMP(3),
    "verified_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beneficiary_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "course_category" NOT NULL,
    "level" "course_level" NOT NULL DEFAULT 'beginner',
    "description" TEXT NOT NULL,
    "image" TEXT,
    "duration" TEXT NOT NULL,
    "price" DECIMAL(10,2) DEFAULT 0,
    "mode" "training_mode" NOT NULL DEFAULT 'online',
    "location" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "seats_total" INTEGER,
    "seats_available" INTEGER,
    "teacher_id" TEXT,
    "instructor_name" TEXT NOT NULL,
    "instructor_role" TEXT,
    "instructor_image" TEXT,
    "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eligibility" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "required_documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visibility" "course_visibility" NOT NULL DEFAULT 'programs',
    "access_code_required" BOOLEAN NOT NULL DEFAULT false,
    "auto_approve" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "course_status" NOT NULL DEFAULT 'active',
    "meta_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_applications" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "applied_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "application_status" NOT NULL DEFAULT 'pending',
    "has_testimonial" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "coupon_applied" BOOLEAN NOT NULL DEFAULT false,
    "amount_due" DECIMAL(10,2) DEFAULT 0,
    "amount_paid" DECIMAL(10,2) DEFAULT 0,
    "payment_status" "payment_status" NOT NULL DEFAULT 'pending',
    "documents" JSONB,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_enrollments" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "batch" TEXT,
    "trainer" TEXT,
    "enrollment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completion_date" TIMESTAMP(3),
    "applied_at" TIMESTAMP(3),
    "status" "enrollment_status" NOT NULL DEFAULT 'enrolled',
    "attendance" INTEGER NOT NULL DEFAULT 0,
    "assessment_score" INTEGER,
    "certificate_generated" BOOLEAN NOT NULL DEFAULT false,
    "documents_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_notes" TEXT,
    "admin_notes" TEXT,
    "auto_approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_syllabus" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "lesson_type" "lesson_type" NOT NULL DEFAULT 'text',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_free_preview" BOOLEAN NOT NULL DEFAULT false,
    "duration_minutes" INTEGER,
    "content" TEXT,
    "video_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_syllabus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_field_config" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "field_type" "field_type" NOT NULL DEFAULT 'text',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "from_profile" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_field_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "certificate_number" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "course_id" TEXT,
    "batch" TEXT,
    "teacher_name" TEXT,
    "issue_date" DATE,
    "completion_date" DATE,
    "generation_date" DATE,
    "expiry_date" DATE,
    "status" "certificate_status" NOT NULL DEFAULT 'pending',
    "published_status" "published_status" NOT NULL DEFAULT 'pending',
    "template_name" TEXT,
    "language" TEXT NOT NULL DEFAULT 'English',
    "verification_url" TEXT,
    "pdf_url" TEXT,
    "generated_by" TEXT,
    "verified_by" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "course_id" TEXT,
    "orientation" TEXT NOT NULL DEFAULT 'Landscape',
    "status" "template_status" NOT NULL DEFAULT 'active',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "preview_color" TEXT NOT NULL DEFAULT 'purple',
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_requests" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "course_id" TEXT,
    "batch" TEXT,
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "request_status" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificate_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "profile_photo" TEXT,
    "designation" TEXT NOT NULL,
    "qualification" TEXT,
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience_years" INTEGER,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "village" TEXT,
    "taluka" TEXT,
    "district" TEXT,
    "state" TEXT NOT NULL DEFAULT 'Maharashtra',
    "pincode" TEXT,
    "status" "teacher_status" NOT NULL DEFAULT 'active',
    "teacher_type" "teacher_type" NOT NULL DEFAULT 'trainer',
    "joined_date" DATE NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aadhaar" TEXT,
    "pan" TEXT,
    "bank_account" TEXT,
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "certifications" INTEGER NOT NULL DEFAULT 0,
    "rating" DECIMAL(3,1) DEFAULT 0.0,
    "bio" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_documents" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "document_status" NOT NULL DEFAULT 'not_uploaded',
    "uploaded_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_courses" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "batch" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "completion_rate" INTEGER NOT NULL DEFAULT 0,
    "status" "teacher_course_status" NOT NULL DEFAULT 'ongoing',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "goal" DECIMAL(12,2) DEFAULT 0,
    "raised" DECIMAL(12,2) DEFAULT 0,
    "image" TEXT,
    "is_strategic" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "course_visibility" NOT NULL DEFAULT 'both',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "image" TEXT,
    "department" TEXT,
    "bio" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "image" TEXT,
    "description" TEXT,
    "is_video" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "content" TEXT,
    "read_time" TEXT,
    "date" DATE,
    "image" TEXT,
    "author" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletters" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATE,
    "read_time" TEXT,
    "image" TEXT,
    "file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "type" "location_type" NOT NULL DEFAULT 'office',
    "coordinator" TEXT,
    "staff_count" INTEGER,
    "active_programs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contact_email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "coordinates" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_info" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_links" (
    "id" TEXT NOT NULL,
    "contact_info_id" TEXT,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "href" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT,
    "course_id" TEXT,
    "initials" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "quote" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schemes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'BookOpen',
    "category" TEXT,
    "date" DATE,
    "link" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'HeartHandshake',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "course_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "valid_from" TIMESTAMP(3),
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "per_user_limit" INTEGER,
    "discount_type" "discount_type" NOT NULL DEFAULT 'percentage',
    "discount_value" DECIMAL(10,2) DEFAULT 0,
    "min_amount" DECIMAL(10,2),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_redemptions" (
    "id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_application_id" TEXT,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Bell',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'Activity',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performed_by" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_profiles_email" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "idx_profiles_phone" ON "profiles"("phone");

-- CreateIndex
CREATE INDEX "idx_profiles_role" ON "profiles"("role");

-- CreateIndex
CREATE INDEX "idx_profiles_status" ON "profiles"("status");

-- CreateIndex
CREATE INDEX "idx_profiles_registration_date" ON "profiles"("registration_date");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiary_details_profile_id_key" ON "beneficiary_details"("profile_id");

-- CreateIndex
CREATE INDEX "idx_beneficiary_details_profile" ON "beneficiary_details"("profile_id");

-- CreateIndex
CREATE INDEX "idx_beneficiary_documents_profile" ON "beneficiary_documents"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "idx_courses_slug" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "idx_courses_category" ON "courses"("category");

-- CreateIndex
CREATE INDEX "idx_courses_visibility" ON "courses"("visibility");

-- CreateIndex
CREATE INDEX "idx_courses_status" ON "courses"("status");

-- CreateIndex
CREATE INDEX "idx_courses_teacher_id" ON "courses"("teacher_id");

-- CreateIndex
CREATE INDEX "idx_course_applications_profile" ON "course_applications"("profile_id");

-- CreateIndex
CREATE INDEX "idx_course_applications_course" ON "course_applications"("course_id");

-- CreateIndex
CREATE INDEX "idx_course_applications_status" ON "course_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "course_applications_profile_id_course_id_key" ON "course_applications"("profile_id", "course_id");

-- CreateIndex
CREATE INDEX "idx_course_enrollments_profile" ON "course_enrollments"("profile_id");

-- CreateIndex
CREATE INDEX "idx_course_enrollments_course" ON "course_enrollments"("course_id");

-- CreateIndex
CREATE INDEX "idx_course_syllabus_course" ON "course_syllabus"("course_id");

-- CreateIndex
CREATE INDEX "idx_course_syllabus_order" ON "course_syllabus"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "course_field_config_course_id_field_key_key" ON "course_field_config"("course_id", "field_key");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificate_number_key" ON "certificates"("certificate_number");

-- CreateIndex
CREATE INDEX "idx_certificates_profile" ON "certificates"("profile_id");

-- CreateIndex
CREATE INDEX "idx_certificates_course" ON "certificates"("course_id");

-- CreateIndex
CREATE INDEX "idx_certificates_status" ON "certificates"("status");

-- CreateIndex
CREATE INDEX "idx_certificates_number" ON "certificates"("certificate_number");

-- CreateIndex
CREATE INDEX "idx_teachers_status" ON "teachers"("status");

-- CreateIndex
CREATE INDEX "idx_teachers_type" ON "teachers"("teacher_type");

-- CreateIndex
CREATE INDEX "idx_teacher_documents_teacher" ON "teacher_documents"("teacher_id");

-- CreateIndex
CREATE INDEX "idx_teacher_courses_teacher" ON "teacher_courses"("teacher_id");

-- CreateIndex
CREATE INDEX "idx_teacher_courses_course" ON "teacher_courses"("course_id");

-- CreateIndex
CREATE INDEX "idx_testimonials_course" ON "testimonials"("course_id");

-- CreateIndex
CREATE INDEX "idx_testimonials_profile" ON "testimonials"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "idx_coupons_course" ON "coupons"("course_id");

-- CreateIndex
CREATE INDEX "idx_coupon_redemptions_user" ON "coupon_redemptions"("user_id");

-- CreateIndex
CREATE INDEX "idx_coupon_redemptions_application" ON "coupon_redemptions"("course_application_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_redemptions_coupon_id_user_id_course_application_id_key" ON "coupon_redemptions"("coupon_id", "user_id", "course_application_id");

-- CreateIndex
CREATE INDEX "idx_notifications_profile" ON "notifications"("profile_id");

-- CreateIndex
CREATE INDEX "idx_notifications_read" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "idx_activities_profile" ON "activities"("profile_id");

-- CreateIndex
CREATE INDEX "idx_activity_log_entity" ON "activity_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_settings_category" ON "settings"("category");

-- CreateIndex
CREATE UNIQUE INDEX "settings_category_key_key" ON "settings"("category", "key");

-- AddForeignKey
ALTER TABLE "beneficiary_details" ADD CONSTRAINT "beneficiary_details_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_addresses" ADD CONSTRAINT "beneficiary_addresses_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_documents" ADD CONSTRAINT "beneficiary_documents_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_applications" ADD CONSTRAINT "course_applications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_applications" ADD CONSTRAINT "course_applications_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_syllabus" ADD CONSTRAINT "course_syllabus_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_field_config" ADD CONSTRAINT "course_field_config_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_requests" ADD CONSTRAINT "certificate_requests_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_requests" ADD CONSTRAINT "certificate_requests_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_documents" ADD CONSTRAINT "teacher_documents_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_courses" ADD CONSTRAINT "teacher_courses_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_courses" ADD CONSTRAINT "teacher_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_links" ADD CONSTRAINT "social_links_contact_info_id_fkey" FOREIGN KEY ("contact_info_id") REFERENCES "contact_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_course_application_id_fkey" FOREIGN KEY ("course_application_id") REFERENCES "course_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey for profiles.id -> "User"(id) DEFERRED to Phase 4:
-- Better Auth creates "User" table on first API call (not via Prisma).
-- Run after Better Auth init:
--   ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey"
--     FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE;
