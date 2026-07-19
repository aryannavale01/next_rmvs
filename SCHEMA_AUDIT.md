# SCHEMA_AUDIT.md — CompassionGlobal / RMVS NGO ERP

**Completed:** 2026-07-19
**Schema files:** `full_schema_production.sql`, `prisma/schema.prisma`
**Scope:** 10 audit stages addressing data safety, referential integrity, normalization, and type correctness

---

## Stage 0: Production Data Assessment

**Finding:** No real production data exists. `.env` contains placeholder credentials (`postgresql://user:password@localhost:5432/compassionglobal`). All seed data uses synthetic UUIDs. Application data runs on localStorage + mock data. **No migration risk.**

**Decision:** Safe to apply destructive schema changes.

---

## Stage 1: Remove Auth Functions + Fix profiles.id

**Problem:** `profiles.id` was `UUID PRIMARY KEY REFERENCES auth.users(id)` with a `handle_new_user()` trigger that auto-created profiles on signup. This created a tight coupling between Better Auth and the profile table. `is_admin()` was unused.

**Changes:**
- `profiles.id`: `UUID PRIMARY KEY REFERENCES auth.users(id)` → `TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::text)`
- All `profile_id` columns: `UUID` → `TEXT`
- `coupon_redemptions.user_id`: `UUID` → `TEXT`
- Added FK: `profiles.id → "User"(id) ON DELETE CASCADE`
- Removed `handle_new_user()` function + trigger
- Removed `is_admin()` function

**Prisma:** No schema change (already `String`).

---

## Stage 2: Remove All Row-Level Security

**Problem:** ARCHITECTURE.md specifies Prisma-layer access control (`requireAuth`/`requireAdmin`). 69 RLS policies across 37 tables were defined but unnecessary overhead. Auth-managed tables (Better Auth) also had unnecessary RLS.

**Changes:** Removed all `ENABLE ROW LEVEL SECURITY` and `CREATE POLICY` statements from every table.

---

## Stage 3: Remove coupon_id from course_enrollments

**Problem:** `coupon_id UUID REFERENCES coupons(id)` existed in `course_enrollments` but was never referenced in any application TypeScript code. `CouponRedemption` handles coupon tracking separately. The column created a misleading 1:1 enrollment↔coupon assumption.

**Changes:**
- **SQL:** Removed `coupon_id UUID` column and FK constraint from `course_enrollments`
- **Prisma:** Removed `couponId` field, `coupon Coupon?` relation from `CourseEnrollment`; removed `enrollments CourseEnrollment[]` from `Coupon`

**App code:** No changes needed — `coupon_id` was never referenced.

---

## Stage 4: Remove certificate_number from course_enrollments

**Problem:** `certificate_number TEXT` in `course_enrollments` was unused — `Certificate.certificateNumber` is the authoritative source. Redundant storage.

**Changes:**
- **SQL:** Removed `certificate_number TEXT` from `course_enrollments`
- **Prisma:** Removed `certificateNumber` field from `CourseEnrollment`

**App code:** No changes needed.

---

## Stage 5: required_documents vs course_field_config — No Change

**Analysis:** `courses.required_documents TEXT[]` lists mandatory documents (Aadhaar, photo, etc.). `course_field_config` defines dynamic form fields per course. They serve different purposes. No duplicate.

**Decision:** No schema change.

---

## Stage 6: teacher_courses — NOT NULL course_id, Remove course_name

**Problem:** `course_id UUID` was nullable, allowing teacher-course records without a linked course. `course_name TEXT` was redundant with `courses.title` and could diverge.

**Changes:**
- **SQL:** `ALTER TABLE teacher_courses ALTER COLUMN course_id SET NOT NULL`; removed `course_name TEXT`
- **Prisma:** `courseId String?` → `courseId String` (required), removed `courseName` field, changed `course Course?` → `course Course`

---

## Stage 7: Add Proper Status Enums

**Problem:** Four status columns used untyped `TEXT` with inconsistent capitalization and freeform values. Prisma enums enforce valid values at the application layer.

**New enums added:**

| Enum | Values | SQL name | Applied to |
|------|--------|----------|------------|
| `CourseStatus` | `draft`, `active`, `archived` | `course_status` | `courses.status` |
| `TemplateStatus` | `active`, `inactive` | `template_status` | `certificate_templates.status` |
| `RequestStatus` | `pending`, `approved`, `rejected` | `request_status` | `certificate_requests.status` |
| `TeacherCourseStatus` | `ongoing`, `completed`, `cancelled` | `teacher_course_status` | `teacher_courses.status` |

**SQL:** Created enum types, `ALTER COLUMN status TYPE ... USING ...` for each table.
**Prisma:** Added 4 enums, changed field types from `String` to typed enums.

---

## Stage 8: CHECK Constraints for seats_available

**Problem:** No database-level validation that `seats_available` is non-negative or within `seats_total`. Only TypeScript-level checks existed.

**Constraints added:**
- `chk_seats_available_non_negative`: `seats_available >= 0`
- `chk_seats_available_within_total`: `seats_total IS NULL OR seats_available <= seats_total`

---

## Stage 9: Soft-Delete Pattern

**Problem:** No delete strategy defined. Physical deletion cascades through certificates, payments, and audit logs.

**Decision:** Soft-delete only. Application sets `status='deleted'` (via `profile_status` enum) on Profile records. No physical `DELETE` operations.

**Cascade safety:** Certificates use `ON DELETE RESTRICT`, blocking hard-delete if any certificates exist. This serves as a final safety net.

**No schema change needed** — `profile_status` enum already includes `'deleted'`.

---

## Stage 10: Add currency + Document Dual Role-Tracking

**10a — Currency:**
- **SQL:** Added `currency TEXT NOT NULL DEFAULT 'INR'` to `courses`
- **Prisma:** Added `currency String @default("INR")` to `Course`

**10b — Dual Role-Tracking (documentation only):**
- `User.role` (Better Auth): controls authentication access (e.g., admin panel entry)
- `Profile.role` (Application): controls business logic (beneficiary vs staff vs volunteer)
- No sync mechanism exists — they are intentionally independent

---

## Summary of Changes

| File | Lines before | Lines after | Changes |
|------|-------------|-------------|---------|
| `full_schema_production.sql` | ~1,103 | ~1,050 | Stages 1-10 |
| `prisma/schema.prisma` | 970 | ~1,003 | Stages 1,3,4,6,7,10 |

### Enums: 23 → 27
### Tables: 39 (unchanged)
### Columns removed: 3 (`coupon_id`, `certificate_number`, `course_name` from respective tables)
### Columns added: 1 (`currency` on courses)
### CHECK constraints added: 2
### RLS policies removed: 69
### Functions removed: 2 (`handle_new_user()`, `is_admin()`)
