-- =============================================================
-- COMPASSIONGLOBAL - COMPLETE PRODUCTION-READY DATABASE SCHEMA
-- Generated: 2026-07-16
-- Updated: 2026-07-19 — SCHEMA AUDIT FIX (Stages 1-10)
-- Includes: All tables, columns, enums, functions, triggers,
--           indexes, constraints, and seed data
-- =============================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- 1. ENUMS (idempotent)
-- =============================================================
DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('MEMBER', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('member', 'admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE profile_status AS ENUM ('active', 'inactive', 'suspended', 'blocked', 'deleted'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE gender AS ENUM ('male', 'female', 'transgender', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE category AS ENUM ('general', 'sc', 'st', 'obc', 'nt', 'sbc', 'ews', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE marital_status AS ENUM ('single', 'married', 'divorced', 'widowed', 'separated'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE occupation AS ENUM ('student', 'farmer', 'labour', 'self_employed', 'government_service', 'private_job', 'homemaker', 'unemployed', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE qualification AS ENUM ('none', 'primary', 'ssc', 'hsc', 'diploma', 'iti', 'graduate', 'post_graduate', 'doctorate'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE course_category AS ENUM ('health', 'tech', 'leadership', 'environment'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE training_mode AS ENUM ('online', 'offline', 'hybrid'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE application_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'completed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE enrollment_status AS ENUM ('enrolled', 'completed', 'dropped'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE certificate_status AS ENUM ('pending', 'approved', 'generated', 'published', 'downloaded', 'revoked'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE published_status AS ENUM ('published', 'unpublished', 'pending'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE document_status AS ENUM ('verified', 'pending', 'rejected', 'not_uploaded'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE teacher_status AS ENUM ('active', 'inactive', 'on_leave', 'resigned'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE teacher_type AS ENUM ('trainer', 'volunteer', 'guest_faculty'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE course_visibility AS ENUM ('homepage', 'programs', 'both'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE location_type AS ENUM ('hub', 'office'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE discount_type AS ENUM ('percentage', 'fixed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'waived'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE lesson_type AS ENUM ('video', 'text', 'quiz', 'assignment'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE field_type AS ENUM ('text', 'textarea', 'select', 'multiselect', 'file', 'date', 'boolean'); EXCEPTION WHEN duplicate_object THEN null; END $$;
-- Stage 7: New status enums (replace free-text status columns)
DO $$ BEGIN CREATE TYPE course_status AS ENUM ('draft', 'active', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE template_status AS ENUM ('active', 'inactive'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE teacher_course_status AS ENUM ('ongoing', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =============================================================
-- 2. TABLES
-- =============================================================

-- 2.1 Profiles
-- Stage 1: id changed from UUID→TEXT to match Better Auth "User"(id) TEXT PK
-- Stage 1: FK moved to ALTER TABLE (Section 4.2) referencing "User"(id)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  gender gender,
  dob DATE,
  role user_role NOT NULL DEFAULT 'member',
  aadhaar_number TEXT,
  pan_number TEXT,
  address_line1 TEXT,
  district TEXT,
  state TEXT,
  pincode TEXT,
  qualification TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  profile_completion INTEGER NOT NULL DEFAULT 0,
  verification_score INTEGER NOT NULL DEFAULT 0,
  status profile_status NOT NULL DEFAULT 'active',
  registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  assigned_volunteer TEXT,
  field_officer TEXT,
  coordinator TEXT,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Beneficiary Details (profile_id: UUID→TEXT)
CREATE TABLE IF NOT EXISTS beneficiary_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  religion TEXT,
  marital_status marital_status,
  occupation occupation,
  annual_income TEXT,
  disability TEXT,
  blood_group TEXT,
  skills TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  emergency_contact TEXT,
  guardian TEXT,
  category category,
  ration_card TEXT,
  education_qualification qualification,
  education_school TEXT,
  education_college TEXT,
  education_passing_year INTEGER,
  education_marks TEXT,
  tags TEXT[] DEFAULT '{}',
  flags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 Beneficiary Addresses (profile_id: UUID→TEXT)
CREATE TABLE IF NOT EXISTS beneficiary_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  village TEXT,
  taluka TEXT,
  district TEXT,
  state TEXT,
  pincode TEXT,
  assembly_constituency TEXT,
  parliament_constituency TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 Beneficiary Documents (profile_id: UUID→TEXT)
CREATE TABLE IF NOT EXISTS beneficiary_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  file_url TEXT,
  status document_status NOT NULL DEFAULT 'not_uploaded',
  uploaded_date TIMESTAMPTZ,
  verified_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 Courses
-- Stage 7: status changed from TEXT→course_status enum
-- Stage 10: added currency column
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category course_category NOT NULL,
  level course_level NOT NULL DEFAULT 'beginner',
  description TEXT NOT NULL,
  image TEXT,
  duration TEXT NOT NULL,
  price NUMERIC(10,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  mode training_mode NOT NULL DEFAULT 'online',
  location TEXT,
  start_date DATE,
  end_date DATE,
  seats_total INTEGER,
  seats_available INTEGER,
  teacher_id UUID,
  instructor_name TEXT NOT NULL,
  instructor_role TEXT,
  instructor_image TEXT,
  benefits TEXT[] DEFAULT '{}',
  eligibility TEXT[] DEFAULT '{}',
  required_documents TEXT[] DEFAULT '{}',
  visibility course_visibility NOT NULL DEFAULT 'programs',
  access_code_required BOOLEAN NOT NULL DEFAULT FALSE,
  auto_approve BOOLEAN NOT NULL DEFAULT FALSE,
  status course_status NOT NULL DEFAULT 'active',
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 Course Applications (profile_id: UUID→TEXT)
CREATE TABLE IF NOT EXISTS course_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  applied_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status application_status NOT NULL DEFAULT 'pending',
  has_testimonial BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  coupon_applied BOOLEAN NOT NULL DEFAULT FALSE,
  amount_due NUMERIC(10,2) DEFAULT 0,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  documents JSONB,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, course_id)
);

-- 2.7 Course Enrollments
-- Stage 1: profile_id: UUID→TEXT
-- Stage 3: removed coupon_id (source of truth: coupon_redemptions)
-- Stage 4: removed certificate_number (source of truth: certificates)
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  batch TEXT,
  trainer TEXT,
  enrollment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completion_date TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  status enrollment_status NOT NULL DEFAULT 'enrolled',
  attendance INTEGER NOT NULL DEFAULT 0,
  assessment_score INTEGER,
  certificate_generated BOOLEAN NOT NULL DEFAULT FALSE,
  documents_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_notes TEXT,
  admin_notes TEXT,
  auto_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.8 Course Syllabus
CREATE TABLE IF NOT EXISTS course_syllabus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  lesson_type lesson_type NOT NULL DEFAULT 'text',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_free_preview BOOLEAN NOT NULL DEFAULT FALSE,
  duration_minutes INTEGER,
  content TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.9 Course Field Config
CREATE TABLE IF NOT EXISTS course_field_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type field_type NOT NULL DEFAULT 'text',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  from_profile BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  options JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, field_key)
);

-- 2.10 Certificates (profile_id: UUID→TEXT)
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number TEXT NOT NULL UNIQUE,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  course_id UUID REFERENCES courses(id) ON DELETE RESTRICT,
  batch TEXT,
  teacher_name TEXT,
  issue_date DATE,
  completion_date DATE,
  generation_date DATE,
  expiry_date DATE,
  status certificate_status NOT NULL DEFAULT 'pending',
  published_status published_status NOT NULL DEFAULT 'pending',
  template_name TEXT,
  language TEXT NOT NULL DEFAULT 'English',
  verification_url TEXT,
  pdf_url TEXT,
  generated_by TEXT,
  verified_by TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.11 Certificate Templates
-- Stage 7: status changed from TEXT→template_status enum
CREATE TABLE IF NOT EXISTS certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  orientation TEXT NOT NULL DEFAULT 'Landscape',
  status template_status NOT NULL DEFAULT 'active',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  preview_color TEXT NOT NULL DEFAULT 'purple',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.12 Certificate Requests
-- Stage 1: profile_id: UUID→TEXT
-- Stage 7: status changed from TEXT→request_status enum
CREATE TABLE IF NOT EXISTS certificate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE RESTRICT,
  batch TEXT,
  request_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status request_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.13 Teachers
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  profile_photo TEXT,
  designation TEXT NOT NULL,
  qualification TEXT,
  specializations TEXT[] DEFAULT '{}',
  experience_years INTEGER,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  village TEXT,
  taluka TEXT,
  district TEXT,
  state TEXT DEFAULT 'Maharashtra',
  pincode TEXT,
  status teacher_status NOT NULL DEFAULT 'active',
  teacher_type teacher_type NOT NULL DEFAULT 'trainer',
  joined_date DATE NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  aadhaar TEXT,
  pan TEXT,
  bank_account TEXT,
  total_students INTEGER NOT NULL DEFAULT 0,
  certifications INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(3,1) DEFAULT 0.0,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.14 Teacher Documents
CREATE TABLE IF NOT EXISTS teacher_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  status document_status NOT NULL DEFAULT 'not_uploaded',
  uploaded_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.15 Teacher Courses
-- Stage 6: removed course_name (derive from courses.title via JOIN)
-- Stage 6: course_id changed from optional→NOT NULL
-- Stage 7: status changed from TEXT→teacher_course_status enum
CREATE TABLE IF NOT EXISTS teacher_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  batch TEXT,
  start_date DATE,
  end_date DATE,
  total_students INTEGER NOT NULL DEFAULT 0,
  completion_rate INTEGER NOT NULL DEFAULT 0,
  status teacher_course_status NOT NULL DEFAULT 'ongoing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.16 Notifications (profile_id: UUID→TEXT)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  icon TEXT NOT NULL DEFAULT 'Bell',
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.17 Activities (profile_id: UUID→TEXT)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  icon TEXT NOT NULL DEFAULT 'Activity',
  title TEXT NOT NULL,
  description TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.18 Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  valid_from TIMESTAMPTZ,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  per_user_limit INTEGER,
  discount_type discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10,2) DEFAULT 0,
  min_amount NUMERIC(10,2),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.19 Coupon Redemptions (user_id: UUID→TEXT)
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_application_id UUID REFERENCES course_applications(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coupon_id, user_id, course_application_id)
);

-- 2.20 Settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category, key)
);

-- 2.21 Programs
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  goal NUMERIC(12,2) DEFAULT 0,
  raised NUMERIC(12,2) DEFAULT 0,
  image TEXT,
  is_strategic BOOLEAN NOT NULL DEFAULT FALSE,
  visibility course_visibility NOT NULL DEFAULT 'both',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.22 Leaders
CREATE TABLE IF NOT EXISTS leaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  image TEXT,
  department TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.23 Gallery Items
CREATE TABLE IF NOT EXISTS gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  description TEXT,
  is_video BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.24 Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  content TEXT,
  read_time TEXT,
  date DATE,
  image TEXT,
  author TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.25 Newsletters
CREATE TABLE IF NOT EXISTS newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE,
  read_time TEXT,
  image TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.26 Locations
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  type location_type NOT NULL DEFAULT 'office',
  coordinator TEXT,
  staff_count INTEGER,
  active_programs TEXT[] DEFAULT '{}',
  contact_email TEXT,
  phone TEXT,
  address TEXT,
  coordinates TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.27 Contact Info
CREATE TABLE IF NOT EXISTS contact_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.28 Social Links
CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_info_id UUID REFERENCES contact_info(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  icon TEXT,
  href TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.29 Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  action TEXT NOT NULL,
  description TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  performed_by TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.30 Testimonials (profile_id: UUID→TEXT)
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  initials TEXT,
  name TEXT NOT NULL,
  role TEXT,
  quote TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.31 Milestones
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.32 Schemes
CREATE TABLE IF NOT EXISTS schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'BookOpen',
  category TEXT,
  date DATE,
  link TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.33 Partners
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'HeartHandshake',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- 3. BETTER AUTH TABLES
-- =============================================================

CREATE TABLE IF NOT EXISTS "User" (
  id TEXT NOT NULL,
  email TEXT NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  name TEXT,
  image TEXT,
  role "Role" NOT NULL DEFAULT 'MEMBER',
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "Session" (
  id TEXT NOT NULL,
  token TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "stepUpVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "Account" (
  id TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP(3),
  "refreshTokenExpiresAt" TIMESTAMP(3),
  scope TEXT,
  "idToken" TEXT,
  password TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Account_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "Verification" (
  id TEXT NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Verification_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "LoginAttempt" (
  id TEXT NOT NULL,
  email TEXT,
  ip TEXT NOT NULL,
  successful BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT,
  CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "AuthActivityLog" (
  id TEXT NOT NULL,
  "userId" TEXT,
  action TEXT NOT NULL,
  metadata TEXT,
  ip TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthActivityLog_pkey" PRIMARY KEY (id)
);

-- =============================================================
-- 4. FOREIGN KEYS
-- =============================================================

-- 4.1 Better Auth FKs
DO $$ BEGIN ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "AuthActivityLog" ADD CONSTRAINT "AuthActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 4.2 Application FKs (added after table creation order)
DO $$ BEGIN ALTER TABLE courses ADD CONSTRAINT "courses_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN null; END $$;
-- Stage 1: profiles.id → "User"(id) — links app profile to Better Auth identity
DO $$ BEGIN ALTER TABLE profiles ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY (id) REFERENCES "User"(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =============================================================
-- 5. INDEXES
-- =============================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_registration_date ON profiles(registration_date);

-- Beneficiary
CREATE INDEX IF NOT EXISTS idx_beneficiary_details_profile ON beneficiary_details(profile_id);
CREATE INDEX IF NOT EXISTS idx_beneficiary_documents_profile ON beneficiary_documents(profile_id);

-- Courses
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_visibility ON courses(visibility);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);

-- Course Applications
CREATE INDEX IF NOT EXISTS idx_course_applications_profile ON course_applications(profile_id);
CREATE INDEX IF NOT EXISTS idx_course_applications_course ON course_applications(course_id);
CREATE INDEX IF NOT EXISTS idx_course_applications_status ON course_applications(status);

-- Course Enrollments
CREATE INDEX IF NOT EXISTS idx_course_enrollments_profile ON course_enrollments(profile_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id);

-- Course Syllabus
CREATE INDEX IF NOT EXISTS idx_course_syllabus_course ON course_syllabus(course_id);
CREATE INDEX IF NOT EXISTS idx_course_syllabus_order ON course_syllabus(sort_order);

-- Certificates
CREATE INDEX IF NOT EXISTS idx_certificates_profile ON certificates(profile_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates(certificate_number);

-- Teachers
CREATE INDEX IF NOT EXISTS idx_teachers_status ON teachers(status);
CREATE INDEX IF NOT EXISTS idx_teachers_type ON teachers(teacher_type);
CREATE INDEX IF NOT EXISTS idx_teacher_courses_teacher ON teacher_courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_courses_course ON teacher_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_teacher_documents_teacher ON teacher_documents(teacher_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_profile ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Activities
CREATE INDEX IF NOT EXISTS idx_activities_profile ON activities(profile_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- Testimonials
CREATE INDEX IF NOT EXISTS idx_testimonials_course ON testimonials(course_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_profile ON testimonials(profile_id);

-- Coupons
CREATE INDEX IF NOT EXISTS idx_coupons_course ON coupons(course_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_application ON coupon_redemptions(course_application_id);

-- Settings
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- Better Auth
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"(email);
CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"(token);
CREATE INDEX IF NOT EXISTS "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"(email, "createdAt");
CREATE INDEX IF NOT EXISTS "LoginAttempt_ip_createdAt_idx" ON "LoginAttempt"(ip, "createdAt");
CREATE INDEX IF NOT EXISTS "AuthActivityLog_userId_createdAt_idx" ON "AuthActivityLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuthActivityLog_action_createdAt_idx" ON "AuthActivityLog"(action, "createdAt");

-- =============================================================
-- 6. FUNCTIONS
-- =============================================================

-- 6.1 Auto-update updated_at timestamp (only surviving function)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 7. TRIGGERS
-- =============================================================

-- 7.1 Auto-update updated_at for all tables that have it
CREATE OR REPLACE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_beneficiary_details_updated_at BEFORE UPDATE ON beneficiary_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_course_applications_updated_at BEFORE UPDATE ON course_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_course_enrollments_updated_at BEFORE UPDATE ON course_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_course_syllabus_updated_at BEFORE UPDATE ON course_syllabus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_course_field_config_updated_at BEFORE UPDATE ON course_field_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_leaders_updated_at BEFORE UPDATE ON leaders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_gallery_items_updated_at BEFORE UPDATE ON gallery_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_contact_info_updated_at BEFORE UPDATE ON contact_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- 8. SEED DATA
-- =============================================================

-- 8.1 Courses
INSERT INTO courses (id, title, slug, category, level, description, image, duration, price, currency, mode, location, start_date, end_date, seats_total, seats_available, instructor_name, instructor_role, instructor_image, benefits, eligibility, required_documents, visibility, access_code_required, auto_approve, status) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Advanced Community Health Nursing', 'advanced-community-health-nursing', 'health', 'intermediate', 'Equip yourself with clinical skills to lead health interventions in remote communities around the globe.', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80', '8 weeks', 0, 'INR', 'offline', 'Rural Health Centers', NULL, NULL, 40, 12, 'Dr. Sarah Kinte', 'Public Health Lead', 'https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&w=150&h=150&q=80', ARRAY['Government recognised certificate', 'Hands-on lab sessions'], ARRAY['Age 18+', 'Basic reading & writing'], ARRAY['Aadhaar Card', 'Passport Size Photo'], 'programs', FALSE, FALSE, 'active'),
  ('c0000000-0000-0000-0000-000000000002', 'Data Science for Social Impact', 'data-science-for-social-impact', 'tech', 'advanced', 'Learn to leverage big data and AI to solve humanitarian crises, optimize aid routing, and project climate effects.', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80', '12 weeks', 0, 'INR', 'online', 'Virtual', NULL, NULL, 20, 2, 'Marcus Chen', 'Senior AI Researcher', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80', ARRAY['Tableau license included', 'Real-world NGO datasets'], ARRAY['Age 18+', 'Basic computer skills'], ARRAY['Aadhaar Card', 'Educational Certificate'], 'programs', FALSE, FALSE, 'active'),
  ('c0000000-0000-0000-0000-000000000003', 'Strategic NGO Leadership', 'strategic-ngo-leadership', 'leadership', 'beginner', 'Master the fundamentals of organizational management, fundraising, and global networking for sustainable development.', 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=600&q=80', '4 weeks', 0, 'INR', 'online', 'Virtual', NULL, NULL, NULL, NULL, 'Prof. Amara Okafor', 'Director of Advocacy', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150&q=80', ARRAY['Seed funding pitch opportunity', 'Mentorship from industry leaders'], ARRAY['Age 21+', 'Graduate degree'], ARRAY['Aadhaar Card', 'Statement of Purpose'], 'programs', FALSE, FALSE, 'active'),
  ('c0000000-0000-0000-0000-000000000004', 'Digital Literacy for Rural Communities', 'digital-literacy-rural-communities', 'tech', 'beginner', 'Empower rural communities with foundational digital skills.', NULL, '8 Weeks', 0, 'INR', 'hybrid', 'Bangalore & Remote', '2026-08-01', '2026-09-25', 30, 12, 'Ananya Gupta', 'Digital Literacy Trainer', NULL, ARRAY['Government recognised certificate', 'Hands-on lab sessions', 'Basic computer kit provided'], ARRAY['Age 18+', 'Basic reading & writing', 'No prior tech experience needed'], ARRAY['Aadhaar Card', 'Passport Size Photo', 'Address Proof'], 'programs', FALSE, FALSE, 'active'),
  ('c0000000-0000-0000-0000-000000000005', 'Community Health Worker Training', 'community-health-worker-training', 'health', 'beginner', 'Comprehensive training on preventive healthcare, maternal & child health, nutrition, and disease surveillance.', NULL, '12 Weeks', 0, 'INR', 'offline', 'Rural Health Centers, Karnataka', '2026-07-15', '2026-10-07', 30, 25, 'Dr. Rajesh Kumar', 'Health Trainer', NULL, ARRAY['WHO-aligned curriculum', 'Field placement assistance', 'Stipend during training'], ARRAY['Age 18-45', '10th standard pass', 'Local language proficiency'], ARRAY['Aadhaar Card', 'Educational Certificate', 'Medical Fitness Certificate'], 'programs', FALSE, FALSE, 'active'),
  ('c0000000-0000-0000-0000-000000000006', 'Social Entrepreneurship & Leadership', 'social-entrepreneurship-leadership', 'leadership', 'advanced', 'Develop leadership skills to launch and manage social enterprises.', NULL, '10 Weeks', 0, 'INR', 'online', 'Virtual', '2026-08-15', '2026-10-20', 20, 8, 'Vikram Mehta', 'Leadership Coach', NULL, ARRAY['Seed funding pitch opportunity', 'Mentorship from industry leaders', 'Certification from partner university'], ARRAY['Age 21+', 'Graduate degree', 'Prior volunteering experience preferred'], ARRAY['Aadhaar Card', 'Educational Certificates', 'Statement of Purpose'], 'programs', FALSE, FALSE, 'active'),
  ('c0000000-0000-0000-0000-000000000007', 'Sustainable Agriculture & Water Management', 'sustainable-agriculture-water-management', 'environment', 'intermediate', 'Learn climate-resilient farming techniques, water conservation methods, and sustainable land management.', NULL, '6 Weeks', 0, 'INR', 'hybrid', 'Field Stations, Tamil Nadu', '2026-09-01', '2026-10-10', 25, 20, 'Lakshmi Devi', 'Agriculture Expert', NULL, ARRAY['Seed bank access', 'Tool kit distributed', 'Farmer network membership'], ARRAY['Age 18+', 'Interest in farming', 'Willingness for field work'], ARRAY['Aadhaar Card', 'Land record (if applicable)'], 'programs', FALSE, FALSE, 'active'),
  ('c0000000-0000-0000-0000-000000000008', 'Emergency Relief & Disaster Management', 'emergency-relief-disaster-management', 'health', 'beginner', 'Training on emergency response protocols, disaster preparedness, first aid, and coordination.', NULL, '4 Weeks', 0, 'INR', 'offline', 'Disaster Response Hub, Odisha', '2026-10-01', '2026-10-28', 30, 30, 'Col. S. P. Singh', 'Disaster Management Expert', NULL, ARRAY['Disaster response kit', 'NDRF certified', 'On-call deployment opportunity'], ARRAY['Age 18-50', 'Physically fit', 'Willing to travel'], ARRAY['Aadhaar Card', 'Physical Fitness Certificate'], 'programs', FALSE, FALSE, 'active');

-- 8.2 Programs
INSERT INTO programs (id, title, category, description, goal, raised, image, is_strategic, visibility) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Future Leaders Initiative', 'Education', 'Providing sustainable educational infrastructure and digital literacy to rural communities.', 45000, 33750, 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=600&q=80', FALSE, 'both'),
  ('a0000000-0000-0000-0000-000000000002', 'Pure Water Network', 'Environment', 'Engineering sustainable water access solutions for high-need regions globally.', 92000, 84640, 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80', FALSE, 'both'),
  ('a0000000-0000-0000-0000-000000000003', 'Mobile Health Clinics', 'Health', 'Bringing professional medical care to remote areas through mobile surgical units.', 12000, 4800, 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80', FALSE, 'both'),
  ('a0000000-0000-0000-0000-000000000004', 'The Great Green Wall Restoration', 'Environment', 'Our flagship environmental program aims to restore 100,000 hectares of vital ecosystems across the Sahel region.', 2500000, 2050000, 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80', TRUE, 'programs'),
  ('a0000000-0000-0000-0000-000000000005', 'Remote Medical Outposts', 'Health', 'Bringing life-saving healthcare and vaccination programs to the most isolated communities.', 450000, 288000, 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80', TRUE, 'programs'),
  ('a0000000-0000-0000-0000-000000000006', 'Code the Future Academy', 'Education', 'Equipping young minds with digital literacy and programming skills to break the cycle of poverty through technology.', 120000, 110400, 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80', TRUE, 'programs'),
  ('a0000000-0000-0000-0000-000000000007', 'Crisis Response Logistics', 'Emergency Relief', 'Maintaining a global supply chain to deliver food, water, and shelter within 48 hours of any disaster.', 800000, 320000, 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80', TRUE, 'programs');

-- 8.3 Leaders
INSERT INTO leaders (id, name, role, image, department, bio) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Dr. Elena Vance', 'Chief Executive Officer', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80', 'Executive', 'Over 20 years leading international relief efforts with a PhD in Development Economics.'),
  ('d0000000-0000-0000-0000-000000000002', 'Marcus Thorne', 'Director of Operations', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&h=400&q=80', 'Operations', 'Specialist in logistics and emergency relief supply chains across challenging geographies.'),
  ('d0000000-0000-0000-0000-000000000003', 'Sarah Chen', 'Chief Impact Officer', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&h=400&q=80', 'Impact Evaluation', 'Dedicated to quantitative evaluation of programs to ensure absolute transparency and efficiency.'),
  ('d0000000-0000-0000-0000-000000000004', 'Amir Rahmani', 'Finance Director', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80', 'Finance', 'Former audit director specializing in NGO regulatory compliance and transparent tracking.');

-- 8.4 Testimonials
INSERT INTO testimonials (id, initials, name, role, quote, rating) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'DC', 'David Chen', 'Global Philanthropist', 'CompassionGlobal sets the absolute gold standard for NGO transparency.', 5),
  ('e0000000-0000-0000-0000-000000000002', 'SW', 'Sarah Williams', 'Lead Volunteer', 'Being a lead volunteer in Sub-Saharan Africa has changed my life.', 5),
  ('e0000000-0000-0000-0000-000000000003', 'ER', 'Dr. Elena Rodriguez', 'Partner Organization', 'Their commitment to local autonomy is what makes their programs actually work long-term.', 5);

-- 8.5 Gallery Items
INSERT INTO gallery_items (id, title, category, image, description, is_video) VALUES
  ('70000000-0000-0000-0000-000000000001', 'Sahel Environmental Assessment', 'Programs', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80', 'Volunteers and local stewards map soil erosion rates in Senegal.', FALSE),
  ('70000000-0000-0000-0000-000000000002', 'Hope in the Market', 'Events', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80', 'A local merchant shares details about her micro-financed business expansion.', FALSE),
  ('70000000-0000-0000-0000-000000000003', 'Clinical Care Standards', 'Archive', 'https://images.unsplash.com/photo-1605684954278-9f5151585b0a?auto=format&fit=crop&w=600&q=80', 'Medical teams prepare sterile instruments in our mobile health surgical clinics.', FALSE),
  ('70000000-0000-0000-0000-000000000004', 'Digital Literacy for Children', 'Videos', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80', 'A young student explores interactive mathematics courses using customized solar tablets.', TRUE),
  ('70000000-0000-0000-0000-000000000005', 'Eco-Friendly Head Office', 'Programs', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80', 'Our carbon-neutral administration and innovation facility in Rwanda.', FALSE),
  ('70000000-0000-0000-0000-000000000006', 'Water Well Celebration', 'Events', 'https://images.unsplash.com/photo-1518887570146-0612132dd618?auto=format&fit=crop&w=600&q=80', 'Children celebrate clean, disease-free running water.', FALSE);

-- 8.6 Blog Posts
INSERT INTO blog_posts (id, title, category, description, read_time, date, image, author) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'The Future of Food Security: How Local Solutions are Shaping Global Policy', 'Featured Story', 'Across three continents, our latest initiative is empowering smallholder farmers with regenerative techniques and digital market access.', '8 min read', '2026-06-01', 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80', 'Elena Rodriguez');

-- 8.7 Newsletters
INSERT INTO newsletters (id, title, date, read_time, image) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'Innovation in Education: The Digital Leap', '2024-05-01', '12 min read', 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80'),
  ('f0000000-0000-0000-0000-000000000002', 'Resilient Health Systems: Quarterly Review', '2024-04-01', '15 min read', 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80'),
  ('f0000000-0000-0000-0000-000000000003', 'Climate Action & Global Conservation', '2024-03-01', '10 min read', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80'),
  ('f0000000-0000-0000-0000-000000000004', 'Empowering Local Economies Through Micro-Grants', '2024-02-01', '8 min read', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80'),
  ('f0000000-0000-0000-0000-000000000005', '2023 Annual Impact Report & 2024 Roadmap', '2024-01-01', '20 min read', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=600&q=80'),
  ('f0000000-0000-0000-0000-000000000006', 'Clean Water: Reaching the Final Mile', '2023-12-01', '12 min read', 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80');

-- 8.8 Locations
INSERT INTO locations (id, name, location, type, coordinator, staff_count, active_programs, contact_email, coordinates, description, phone, address) VALUES
  ('00000000-0000-0000-0000-000000000001', 'East Africa Logistics Hub', 'Nairobi, Kenya', 'hub', 'Dr. John Kiprop', 42, ARRAY['Sahel Restoration', 'Mobile Nursing Clinics', 'Solar Classrooms'], 'nairobi@compassionglobal.org', '1.2921° S, 36.8219° E', 'Our primary operations base for Sub-Saharan Africa.', NULL, NULL),
  ('00000000-0000-0000-0000-000000000002', 'Southeast Asia Field Office', 'Phnom Penh, Cambodia', 'hub', 'Sophea Meade', 28, ARRAY['Code the Future Academy', 'Water Infrastructure Solutions', 'Micro-grants'], 'phnompenh@compassionglobal.org', '11.5564° N, 104.9282° E', 'Focused on digital literacy and vocational software training.', NULL, NULL),
  ('00000000-0000-0000-0000-000000000003', 'Senegal Regional Hub', 'Dakar, Senegal', 'office', NULL, NULL, NULL, 'dakar.office@compassionglobal.org', NULL, 'Regional operations office serving West Africa.', '+221 33 824 1020', 'Rue de Louga, Point E, Dakar'),
  ('00000000-0000-0000-0000-000000000004', 'Rwanda Admin HQ', 'Kigali, Rwanda', 'office', NULL, NULL, NULL, 'kigali.office@compassionglobal.org', NULL, 'Administrative headquarters for African operations.', '+250 252 584 900', 'KG 541 St, Nyarutarama, Kigali'),
  ('00000000-0000-0000-0000-000000000005', 'United States Advocacy Office', 'Washington, DC', 'office', NULL, NULL, NULL, 'dc.office@compassionglobal.org', NULL, 'Advocacy and donor relations office for North America.', '+1 202 555 0192', '1201 Connecticut Ave NW, Washington, DC'),
  ('00000000-0000-0000-0000-000000000006', 'Peru South America Hub', 'Lima, Peru', 'office', NULL, NULL, NULL, 'lima.office@compassionglobal.org', NULL, 'South America regional operations hub.', '+51 1 614 7000', 'Av. Arequipa 3420, San Isidro, Lima');

-- 8.9 Contact Info & Social Links
INSERT INTO contact_info (id, email, phone) VALUES
  ('10000000-0000-0000-0000-000000000001', 'info@compassionglobal.org', '+1 202 555 0192');

INSERT INTO social_links (contact_info_id, label, icon, href) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Email', 'Mail', 'mailto:info@compassionglobal.org'),
  ('10000000-0000-0000-0000-000000000001', 'Twitter', 'X', '#'),
  ('10000000-0000-0000-0000-000000000001', 'LinkedIn', 'Linkedin', '#'),
  ('10000000-0000-0000-0000-000000000001', 'Instagram', 'Instagram', '#');

-- 8.10 Schemes
INSERT INTO schemes (id, title, description, icon, category, date, link) VALUES
  ('20000000-0000-0000-0000-000000000001', 'PM Kisan Samman Nidhi', 'Direct income support of Rs. 6000/year for farmers.', 'Users', 'Agriculture', '2026-09-01', '#'),
  ('20000000-0000-0000-0000-000000000002', 'National Rural Livelihood Mission (NRLM)', 'Skill training and self-employment opportunities for rural women.', 'Users', 'Women Empowerment', '2026-08-15', '#'),
  ('20000000-0000-0000-0000-000000000003', 'Stand-Up India Scheme', 'Bank loans for SC/ST and women entrepreneurs.', 'GraduationCap', 'Entrepreneurship', '2026-09-10', '#'),
  ('20000000-0000-0000-0000-000000000004', 'Ayushman Bharat', 'Health coverage up to Rs. 5 lakh per family per year.', 'Heart', 'Health', '2026-08-20', '#'),
  ('20000000-0000-0000-0000-000000000005', 'National Scholarship Portal (NSP)', 'Central and state scholarship schemes for SC/ST/OBC/minority students.', 'BookOpen', 'Education', '2026-09-05', '#'),
  ('20000000-0000-0000-0000-000000000006', 'Startup India Seed Fund Scheme', 'Financial support for early-stage startups up to Rs. 50 lakhs.', 'Lightbulb', 'Entrepreneurship', '2026-10-01', '#');

-- 8.11 Certificate Templates (Stage 7: status uses template_status enum, lowercase)
INSERT INTO certificate_templates (id, name, description, orientation, status, is_default, preview_color) VALUES
  ('30000000-0000-0000-0000-000000000001', 'Standard Certificate', 'Default certificate template for all courses', 'Landscape', 'active', TRUE, 'purple'),
  ('30000000-0000-0000-0000-000000000002', 'Gold Certificate', 'Premium certificate with golden border for top performers', 'Landscape', 'active', FALSE, 'amber'),
  ('30000000-0000-0000-0000-000000000003', 'Digital Badge', 'Digital-friendly badge format for online sharing', 'Portrait', 'active', FALSE, 'blue'),
  ('30000000-0000-0000-0000-000000000004', 'Advanced Course Certificate', 'Detailed certificate for technical courses', 'Landscape', 'active', FALSE, 'teal');

-- 8.12 Teachers
INSERT INTO teachers (id, full_name, designation, qualification, specializations, experience_years, email, mobile, district, state, status, teacher_type, joined_date, total_students, certifications, rating, bio) VALUES
  ('40000000-0000-0000-0000-000000000001', 'Rajesh Patil', 'Senior Trainer', 'M.Ed', ARRAY['Digital Literacy', 'STEM Education'], 12, 'rajesh.patil@ngo.org', '+91 9876543210', 'Jalgaon', 'Maharashtra', 'active', 'trainer', '2025-01-15', 120, 4, 4.5, 'Rajesh Patil is a dedicated senior trainer with 12 years of experience.'),
  ('40000000-0000-0000-0000-000000000002', 'Sunita Deshmukh', 'Junior Trainer', 'BA', ARRAY['Financial Literacy', 'Women Empowerment'], 5, 'sunita.deshmukh@ngo.org', '+91 9876543211', 'Dhule', 'Maharashtra', 'active', 'trainer', '2025-03-01', 75, 2, 4.2, 'Sunita is passionate about financial literacy for rural women.'),
  ('40000000-0000-0000-0000-000000000003', 'Amit Joshi', 'Master Trainer', 'BE', ARRAY['Advanced Web Development', 'STEM Education'], 8, 'amit.joshi@ngo.org', '+91 9876543212', 'Nashik', 'Maharashtra', 'active', 'trainer', '2024-06-01', 95, 3, 4.8, 'Amit specializes in web development and STEM education.'),
  ('40000000-0000-0000-0000-000000000004', 'Priya Kulkarni', 'Subject Matter Expert', 'MBBS', ARRAY['Healthcare', 'Community Health'], 15, 'priya.kulkarni@ngo.org', '+91 9876543213', 'Pune', 'Maharashtra', 'active', 'trainer', '2024-01-10', 200, 5, 4.9, 'Dr. Priya Kulkarni is a medical professional with 15 years of experience.'),
  ('40000000-0000-0000-0000-000000000005', 'Vikram Jadhav', 'Volunteer Coordinator', 'MSW', ARRAY['Agriculture', 'Community Development'], 6, 'vikram.jadhav@ngo.org', '+91 9876543214', 'Nandurbar', 'Maharashtra', 'active', 'volunteer', '2025-06-01', 60, 1, 4.0, 'Vikram coordinates volunteer programs in agriculture.');

-- 8.13 Milestones
INSERT INTO milestones (id, year, title, description) VALUES
  ('50000000-0000-0000-0000-000000000001', 2010, 'The Foundation', 'CompassionGlobal was founded by a small group of humanitarian experts focused on field-first intervention in Southeast Asia.'),
  ('50000000-0000-0000-0000-000000000002', 2015, 'Scaling Education', 'Launched the Global Scholars program, providing full tuition and vocational training to over 5,000 students in Sub-Saharan Africa.'),
  ('50000000-0000-0000-0000-000000000003', 2022, 'Digital Infrastructure', 'Implemented real-time financial tracking for all donors, ensuring every cent is accounted for and impact-driven.');

-- 8.14 Partners
INSERT INTO partners (id, name, icon) VALUES
  ('60000000-0000-0000-0000-000000000001', 'United Nations Development Programme', 'Globe'),
  ('60000000-0000-0000-0000-000000000002', 'World Health Organization', 'Heart'),
  ('60000000-0000-0000-0000-000000000003', 'Doctors Without Borders', 'Stethoscope'),
  ('60000000-0000-0000-0000-000000000004', 'Habitat for Humanity', 'Home'),
  ('60000000-0000-0000-0000-000000000005', 'Oxfam International', 'HandHeart');

-- =============================================================
-- 9. SEAT INTEGRITY CONSTRAINTS (Stage 8)
-- =============================================================
ALTER TABLE courses ADD CONSTRAINT chk_seats_available_non_negative CHECK (seats_available >= 0);
ALTER TABLE courses ADD CONSTRAINT chk_seats_available_within_total CHECK (seats_total IS NULL OR seats_available <= seats_total);

-- =============================================================
-- 10. DONE
-- =============================================================
