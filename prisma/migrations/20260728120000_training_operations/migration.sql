-- Training Operations Dashboard migration
-- Phase 1: Update enums (PostgreSQL requires type replacement to remove enum values)

-- application_status: remove 'approved', 'completed'; add 'documents_verified', 'seat_reserved', 'waitlisted'
ALTER TABLE "course_applications" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "course_applications" ALTER COLUMN "status" TYPE TEXT;

-- Map existing enum values that will be removed
UPDATE "course_applications" SET "status" = 'seat_reserved' WHERE "status" = 'approved';
UPDATE "course_applications" SET "status" = 'pending' WHERE "status" = 'completed';

DROP TYPE "application_status";

CREATE TYPE "application_status" AS ENUM ('pending', 'under_review', 'documents_verified', 'seat_reserved', 'rejected', 'waitlisted');

ALTER TABLE "course_applications" ALTER COLUMN "status" TYPE "application_status" USING status::text::application_status;
ALTER TABLE "course_applications" ALTER COLUMN "status" SET DEFAULT 'pending';

-- enrollment_status: add 'in_progress', 'certified'
ALTER TYPE "enrollment_status" ADD VALUE IF NOT EXISTS 'in_progress' BEFORE 'completed';
ALTER TYPE "enrollment_status" ADD VALUE IF NOT EXISTS 'certified' AFTER 'completed';

-- Phase 2: Drop seats_available from courses
ALTER TABLE "courses" DROP COLUMN IF EXISTS "seats_available";

-- Phase 3: Add new columns to course_applications
ALTER TABLE "course_applications" ADD COLUMN IF NOT EXISTS "seat_reserved_at" TIMESTAMP(3);
ALTER TABLE "course_applications" ADD COLUMN IF NOT EXISTS "waitlisted_at" TIMESTAMP(3);
ALTER TABLE "course_applications" ADD COLUMN IF NOT EXISTS "review_notes" TEXT;
ALTER TABLE "course_applications" ADD COLUMN IF NOT EXISTS "approved_by_id" TEXT;
ALTER TABLE "course_applications" ADD COLUMN IF NOT EXISTS "converted_at" TIMESTAMP(3);

-- Phase 4: Add new columns to course_enrollments, rename batch -> batch_label
ALTER TABLE "course_enrollments" ADD COLUMN IF NOT EXISTS "seat_number" INTEGER;
ALTER TABLE "course_enrollments" ADD COLUMN IF NOT EXISTS "started_at" TIMESTAMP(3);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_enrollments' AND column_name = 'batch'
  ) THEN
    ALTER TABLE "course_enrollments" RENAME COLUMN "batch" TO "batch_label";
  END IF;
END $$;

-- Phase 5: Create admin_notes table
CREATE TABLE IF NOT EXISTS "admin_notes" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_admin_notes_application" ON "admin_notes"("application_id");
CREATE INDEX IF NOT EXISTS "idx_admin_notes_author" ON "admin_notes"("author_id");

ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_application_id_fkey"
  FOREIGN KEY ("application_id") REFERENCES "course_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
