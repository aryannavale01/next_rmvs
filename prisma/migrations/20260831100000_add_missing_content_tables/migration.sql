-- CreateEnum
CREATE TYPE "leader_status" AS ENUM ('active', 'inactive', 'deleted');

-- CreateEnum
CREATE TYPE "content_status" AS ENUM ('active', 'deleted');

-- CreateEnum
CREATE TYPE "blog_post_status" AS ENUM ('published', 'draft', 'deleted');

-- CreateEnum
CREATE TYPE "org_document_type" AS ENUM ('NGO_REGISTRATION_CERTIFICATE', 'PAN_CARD', 'TAN_CARD', 'NITI_AAYOG_REGISTRATION', 'CSR1', 'ANNUAL_REPORT', 'WORK_ORDER', 'ORG_PROFILE', 'CERTIFICATE_12A', 'CERTIFICATE_80G');

-- AlterEnum
ALTER TYPE "application_status" ADD VALUE 'deleted';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "course_category" ADD VALUE 'agriculture';
ALTER TYPE "course_category" ADD VALUE 'skill_dev';
ALTER TYPE "course_category" ADD VALUE 'basic_digital';

-- AlterEnum
ALTER TYPE "teacher_status" ADD VALUE 'deleted';

-- AlterTable
ALTER TABLE "blog_posts" ADD COLUMN     "status" "blog_post_status" NOT NULL DEFAULT 'published';

-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "course_name" TEXT,
ADD COLUMN     "enrollment_id" TEXT,
ADD COLUMN     "member_name" TEXT,
ADD COLUMN     "pdf_storage_path" TEXT,
ADD COLUMN     "revoked_at" TIMESTAMP(3),
ADD COLUMN     "revoked_reason" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "verification_code" VARCHAR(32);

-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "status" "content_status" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "course_applications" ADD COLUMN     "address" TEXT,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "motivation" TEXT;

-- AlterTable
ALTER TABLE "course_enrollments" ADD COLUMN     "dropped_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "gallery_items" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "logged_date" DATE,
ADD COLUMN     "status" "content_status" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "leaders" ADD COLUMN     "quote" TEXT,
ADD COLUMN     "status" "leader_status" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "status" "content_status" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "milestones" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "status" "content_status" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "newsletters" ADD COLUMN     "body" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "sent_at" TIMESTAMP(3),
ADD COLUMN     "sent_count" INTEGER,
ADD COLUMN     "status" "content_status" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "partners" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "status" "content_status" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "admin_notes" TEXT;

-- AlterTable
ALTER TABLE "programs" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "status" "content_status" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "testimonials" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "status" "content_status" NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_documents" (
    "id" TEXT NOT NULL,
    "type" "org_document_type" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_url" TEXT,
    "storage_path" TEXT,
    "mime_type" TEXT,
    "file_size" INTEGER,
    "year" INTEGER,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcast_notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Bell',
    "target" TEXT NOT NULL DEFAULT 'All Members',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broadcast_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_inquiries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "hours_per_week" TEXT NOT NULL,
    "motivation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volunteer_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "donor_name" TEXT NOT NULL,
    "donor_email" TEXT NOT NULL,
    "donor_phone" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "frequency" TEXT NOT NULL DEFAULT 'one-time',
    "receipt_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "razorpay_signature" TEXT,
    "payment_method" TEXT,
    "failure_reason" TEXT,
    "paid_at" TIMESTAMPTZ(3),
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'footer',
    "unsubscribed" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_entries" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "window_end" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "site_settings_key_key" ON "site_settings"("key");

-- CreateIndex
CREATE INDEX "idx_site_settings_category" ON "site_settings"("category");

-- CreateIndex
CREATE INDEX "idx_org_documents_type" ON "org_documents"("type");

-- CreateIndex
CREATE INDEX "idx_org_documents_public" ON "org_documents"("is_public", "is_active");

-- CreateIndex
CREATE INDEX "idx_org_documents_order" ON "org_documents"("display_order");

-- CreateIndex
CREATE INDEX "idx_broadcast_notifications_created" ON "broadcast_notifications"("created_at");

-- CreateIndex
CREATE INDEX "idx_volunteer_inquiries_status" ON "volunteer_inquiries"("status");

-- CreateIndex
CREATE INDEX "idx_volunteer_inquiries_created" ON "volunteer_inquiries"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "donations_receipt_id_key" ON "donations"("receipt_id");

-- CreateIndex
CREATE UNIQUE INDEX "donations_razorpay_order_id_key" ON "donations"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "donations_razorpay_payment_id_key" ON "donations"("razorpay_payment_id");

-- CreateIndex
CREATE INDEX "idx_donations_donor_email" ON "donations"("donor_email");

-- CreateIndex
CREATE INDEX "idx_donations_status" ON "donations"("status");

-- CreateIndex
CREATE INDEX "idx_donations_razorpay_order" ON "donations"("razorpay_order_id");

-- CreateIndex
CREATE INDEX "idx_donations_created" ON "donations"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE INDEX "idx_newsletter_subscribers_email" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_entries_key_key" ON "rate_limit_entries"("key");

-- CreateIndex
CREATE INDEX "idx_rate_limit_window_end" ON "rate_limit_entries"("window_end");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_verification_code_key" ON "certificates"("verification_code");

-- CreateIndex
CREATE INDEX "idx_certificates_enrollment" ON "certificates"("enrollment_id");

-- CreateIndex
CREATE INDEX "idx_certificates_verification_code" ON "certificates"("verification_code");

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollments_profile_id_course_id_key" ON "course_enrollments"("profile_id", "course_id");

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "course_enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
