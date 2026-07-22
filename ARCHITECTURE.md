# CompassionGlobal — Rupasri Mahila Vikas Sanstha NGO ERP
## System Architecture Document

**Last updated:** July 18, 2026
**Status:** Active development — post-audit rebuild in progress
**Maintained by:** Aryan Navale

---

## 1. System Overview

CompassionGlobal is a full-stack ERP platform for Rupasri Mahila Vikas Sanstha, an NGO managing women's empowerment programs. The system handles beneficiary enrollment, document verification, course/training management, certificate issuance, and public-facing website content — all within a **single Next.js application**, not separate deployed services.

**Core principle:** One deployable app, three route groups, one database, one auth system. This is a deliberate architectural choice (not a limitation) — see Section 9 for reasoning.

### 1.1 Who uses this system

| User Type | Access Point | Purpose |
|---|---|---|
| Public visitor | `/` (public site) | Learn about the NGO, browse programs |
| Beneficiary/Member | `/dashboard/*` | Apply to courses, upload documents, track enrollment, download certificates |
| Admin/Staff | `/admin/*` | Manage members, courses, enrollments, certificates, coupons, website content |

---

## 2. Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16.x (App Router) | Turbopack dev server |
| Language | TypeScript | ^5 | Strict mode |
| UI Library | React | 19.x | |
| Styling | Tailwind CSS | v4 | + shadcn/ui components |
| Database ORM | Prisma | ^6.x | |
| Database | PostgreSQL (Supabase-hosted) | — | Pooled connection for runtime, direct for migrations |
| Auth | Better Auth | ^1.6.x | Single auth system for both members and admins |
| File Storage | Supabase Storage | — | Private buckets, signed URLs, server-side uploads only |
| Image Processing | Sharp (server) + browser-image-compression (client) | — | WebP conversion, size reduction |
| PDF Generation | @react-pdf/renderer | — | Server-side certificate generation |
| i18n | next-intl | v4.x | English, Hindi, Marathi |
| Email | Resend | — | Transactional email (HTTP API) |
| Error Tracking | Sentry | — | Configured, credentials pending |
| Testing | Vitest + Testing Library | — | Unit/component tests |
| Deployment | Vercel | — | Target: zero/near-zero monthly cost |

---

## 3. Route Architecture

```
/                           → Public website (marketing, programs, about, donate)
/login                      → Member login
/signup, /register          → Member registration
/forgot-password            → Password recovery request
/reset-password             → Password reset (token-based)

/dashboard                  → Member dashboard home
/dashboard/profile          → Profile edit + document upload + change password
/dashboard/training         → Browse courses / My Courses tabs
/dashboard/training/[courseId]           → Course detail
/dashboard/training/apply/[courseId]     → Application form
/dashboard/applications     → Application status tracking
/dashboard/certificates     → View/generate/download certificates
/dashboard/notifications    → Notification inbox
/dashboard/activity         → Personal activity timeline

/admin/login                → Admin login (separate entry, same Better Auth backend)
/admin                      → Admin dashboard home
/admin/members               → Beneficiary management
/admin/teachers               → Teacher/instructor management
/admin/training                → Course management (list + wizard + detail)
/admin/training/[courseId]     → Course detail (applications, enrolled, fields, coupons, syllabus)
/admin/enrollments            → Cross-course enrollment management
/admin/certificates            → Certificate generation/approval
/admin/coupons                  → Coupon CRUD
/admin/notifications            → Compose + broadcast
/admin/activity-logs             → Read-only audit trail
/admin/website-content            → CMS for public site
/admin/settings                    → App-wide configuration

/force-password-change             → Forced password change (post-seed, pre-dashboard)

/verify/[certificateNumber]  → Public certificate verification (no auth required)

/api/auth/[...all]           → Better Auth handler
/api/upload                  → Server-side file upload (Supabase Storage, service role)
/api/user/me                 → Current session/role lookup
/api/admin/force-password-change-complete → Clear mustChangePassword flag
/api/admin/verify-stepup     → Step-up re-authentication (POST)
/api/admin/verify-stepup/check → Check if step-up is needed (GET)
```

**Route protection:** enforced in `proxy.ts` (Next.js 16 — replaces deprecated `middleware.ts`) using broad matcher patterns (`/admin/:path*`, `/dashboard/:path*`) so new sub-routes are automatically protected without manual matcher updates.

---

## 4. Authentication & Authorization

### 4.1 Single auth system
**Better Auth** handles both member and admin authentication — there is no separate admin auth system. Members and admins share the same `User`/`Account`/`Session` tables; the distinction is a `role` field (`MEMBER` | `ADMIN`).

- Separate login pages (`/login`, `/admin/login`) hit the **same** Better Auth backend — this is intentional UX separation, not a separate system.
- No admin self-registration — a single superadmin is seeded via script.
- Password hashing: Better Auth's native scrypt. (Legacy bcrypt/scrypt dual-hash utilities from earlier iterations are dead code, scheduled for removal.)
- Session: 30-day expiry, 5-minute cookie cache, custom cookie prefix (`cg.`).
- Rate limiting applied to **both** member and admin login.

### 4.2 Role checks
- A single shared `requireAuth()` / `requireAdmin()` utility (in `src/lib/session.ts`) is used everywhere auth is checked — no per-file local redefinitions. (This replaced a prior pattern where 9+ admin action files each defined their own copy, which was flagged as a maintenance/security risk.)
- `proxy.ts` performs a lightweight cookie-existence check for `/dashboard/*`, and a cookie + role check for `/admin/*`.
- Every Server Action independently re-verifies auth/role server-side — the UI never being reachable is not treated as sufficient protection on its own.

### 4.3 Dual profile design
- `User` (Better Auth) holds authentication identity.
- `profiles` (app-specific) holds NGO/beneficiary data (Aadhaar, address, education, etc.).
- `profiles.id` has a proper FK constraint to `User.id` (`onDelete: Cascade`) — added to close an orphaned-record gap found during audit.
- Profile creation happens **synchronously at signup**, inside a transaction with User creation — not lazily on first dashboard visit.

### 4.4 Dual role-tracking
Two independent role fields exist — they are intentionally separate and serve different purposes:

| Field | Table | Purpose | Values | Set by |
|-------|-------|---------|--------|--------|
| `role` | `User` (Better Auth) | Authentication gating — controls access to admin panel, API endpoints | `MEMBER`, `ADMIN` | Seed script (superadmin), admin actions |
| `role` | `profiles` (Application) | Business logic — controls what the user can see/do within the app | `member`, `admin`, `staff`, `volunteer` | Admin UI, profile updates |

**There is no sync mechanism between them.** They are not required to match — a `User.role = ADMIN` with `profiles.role = member` is technically possible but should be avoided operationally. The auth layer (`requireAuth`/`requireAdmin`) checks `User.role`, not `profiles.role`.

**Deletion strategy:** Physical `DELETE` on `profiles` cascades to `User` via FK. Soft-delete (setting `profiles.status = 'deleted'`) is the recommended approach — the application never hard-deletes.

### 4.5 Forced password change (superadmin bootstrap)
- The seed script creates the superadmin with `mustChangePassword: true` and a password from the `SUPERADMIN_PASSWORD` environment variable.
- On every admin page load, `app/admin/layout.tsx` checks this flag server-side. If `true`, the user is redirected to `/force-password-change` — no admin page is accessible until the password is changed.
- The password change uses Better Auth's built-in `changePassword` method (not a raw DB write), keeping hash consistency.
- After successful change, `mustChangePassword` is set to `false` via a server API route, and normal access is restored.
- This is a **bootstrap-only** mechanism — the `.env` password is temporary and must be changed on first login.

### 4.6 TOTP two-factor authentication (admin accounts)
- Enabled via Better Auth's `twoFactor` plugin (TOTP provider).
- **Mandatory for all ADMIN accounts** — enforced in `app/admin/layout.tsx`. Admins without 2FA enabled are redirected to `/admin/setup-2fa`.
- The setup flow: enter password → display QR code → scan with authenticator app → verify TOTP code → 2FA enabled.
- Login flow with 2FA: email/password → Better Auth detects 2FA enabled → redirect to `/admin/verify-2fa` → enter TOTP code → full session granted.
- Backup codes are provided during enrollment for recovery.
- Client-side: `twoFactorClient` plugin handles redirect to verification page automatically.

### 4.7 Step-up authentication (sensitive admin actions)
- The `Session.stepUpVerifiedAt` field tracks when an admin last re-authenticated for sensitive operations.
- Sensitive actions are defined in `lib/admin-security.ts` as an auditable constant list (role changes, deletions, settings changes, etc.).
- `requireStepUp()` in `lib/session.ts` checks: session must exist, user must be ADMIN, and `stepUpVerifiedAt` must be within the 15-minute window.
- Verification endpoint (`/api/admin/verify-stepup`) validates the admin's password and updates `stepUpVerifiedAt` on success.
- Client-side check endpoint (`/api/admin/verify-stepup/check`) allows UI components to determine if re-authentication is needed before executing an action.

### 4.8 Audit logging
- `AuthActivityLog` table tracks admin authentication events: login success/failure, password changes, step-up verifications, TOTP enable/disable.
- Each entry includes: user ID, action type, optional metadata (JSON), IP address, and timestamp.
- Logging utility: `lib/audit-log.ts` — `logAuthEvent()` writes to the table with error resilience (failed logs don't block the action).
- The existing `activity_log` table and client-side mock activity logs are separate and unaffected.

---

## 5. Database Architecture

### 5.1 Connection strategy
```
DATABASE_URL   → Supabase pooled connection (port 6543, pgbouncer=true) — used by Prisma Client at runtime
DIRECT_URL     → Direct connection (port 5432) — used only for `prisma migrate`
```
A `withRetry()` helper wraps Prisma calls to handle pool-exhaustion errors (P2024) with backoff.

### 5.2 Core model groups

**Identity:** `User`, `Session`, `Account`, `Verification`, `LoginAttempt`, `AuthActivityLog`

**Beneficiary data:** `profiles`, `beneficiary_details`, `beneficiary_addresses`, `beneficiary_documents`

**Training & certification:** `courses`, `course_field_config`, `course_applications`, `course_enrollments`, `certificates`, `certificate_requests`, `certificate_templates`

**Coupons:** `coupons`, `coupon_redemptions`

**CMS:** `programs`, `leaders`, `testimonials`, `gallery_items`, `blog_posts`, `newsletters`, `locations`, `contact_info`, `social_links`, `milestones`, `schemes`, `partners`

**Activity/Notifications:** `activities`, `activity_log`, `notifications`

**Settings:** `settings` (category + key, JSON value store)

### 5.3 Relation integrity rules
- `certificates` → `profiles`: `onDelete: Restrict` (certificates are legal documents; a member cannot be deleted while certificates exist).
- `courses` → enrollments/certificates/applications: `onDelete: Restrict` (a course cannot be deleted while it has associated records).
- `coupon_redemptions` → `course_applications`: `onDelete: SetNull`.
- Deleting a member (`deleteMember()`) must also clean up their Supabase Storage files and is blocked if certificates exist.

### 5.4 Indexing
All frequently filtered/joined columns are indexed: `profiles` (email, phone, role, status, registration_date), `courses` (category, slug, visibility, status), `course_applications`/`course_enrollments` (profile_id, course_id + unique constraints), `certificates` (course_id, certificate_number, profile_id, status), plus `beneficiary_documents.type`, `beneficiary_details` (category, occupation, education_qualification), and a composite index on `activity_log(entity_type, action)`.

---

## 6. File Storage Architecture

- **Buckets are private**, split by document type (Aadhaar and PAN in **separate** buckets — not combined, to avoid cross-contamination of sensitive document types).
- **All uploads go through a server-side API route** (`/api/upload`) using the Supabase **service role key** — never the anon key from the client. This is necessary because Better Auth sessions are not recognized by Supabase's native `auth.uid()`, so client-side RLS cannot enforce access control here; the app's own session check is the access-control layer instead.
- **Compression pipeline:** client-side (`browser-image-compression`) for speed, then server-side (`sharp`) as the authoritative pass — every image is resized to max 1600px and converted to WebP, quality 75, regardless of what the client sent.
- **File type validation** checks actual file content (magic bytes), not just the client-reported MIME type.
- **Old files are deleted** from Storage when a document is replaced or a member is removed.
- **Signed URLs** (time-limited) are used for viewing/downloading private documents — never permanent public URLs.

---

## 7. Core Domain Flow — Course Enrollment (end-to-end)

This is the central business flow of the system:

1. **Admin creates a course** via a 9-step wizard: Basic Info → Instructor (selected from real Teacher records, not free text) → Schedule → Seats → Pricing → Coupons (inline creation) → Required Documents → Syllabus → Settings/Visibility. Course remains in Draft until explicitly Published.
2. **Member browses** `/dashboard/training` — only Published courses are visible, with real-time seat availability.
3. **Member views course detail** → clicks Apply.
4. **Profile completeness check** runs before the application form is shown. Incomplete profiles are redirected to `/dashboard/profile` with the specific missing fields flagged.
5. **Application form** is rendered dynamically per `course_field_config` (per-course field show/require toggles), pre-filled from the member's profile where applicable.
6. **Coupon code** (optional) is validated against: active status, expiry, max uses, course scope, and whether this member already redeemed it.
7. **Application submitted** → `course_applications` record created (status: `pending`), coupon redemption recorded if applicable, seat hold logic applied.
8. **Admin reviews** the application at `/admin/training/[courseId]` → Applications tab, with uploaded documents (Aadhaar, PAN, etc.) visible inline for verification.
9. **Admin Approves** → `course_enrollments` record auto-created, application status → `approved`, seat count decremented, notification sent to member. **Admin Rejects** → application status → `rejected` with reason, notification sent.
10. **Member dashboard reflects the outcome immediately** — application status, notification, and (if approved) enrollment status all update without requiring a refresh workaround or cache-clear.
11. Enrollment proceeds through attendance/completion tracking → certificate eligibility → certificate generation (server-side PDF, stored once, served on repeat downloads) → public verification via `/verify/[certificateNumber]`.

This flow is treated as the primary correctness benchmark for the system — any refactor must be re-verified against this full sequence before being considered complete.

---

## 8. Certificate System

- Generated **server-side** using `@react-pdf/renderer` (not client-side html2canvas/jsPDF) — chosen for its component-based layout model, which handles centered variable-length names, QR codes, and bilingual text far more reliably than coordinate-based drawing.
- Generated **once**, stored in Supabase Storage; downloads serve the stored file rather than regenerating.
- Certificate numbering is unified (one format, one generation path) across both member-initiated and admin-initiated generation, with a database uniqueness check and retry-on-collision.
- Each certificate embeds a QR code linking to `/verify/[certificateNumber]`, a public, unauthenticated route showing only non-sensitive verification data (name, course, dates, status) — never Aadhaar/PAN/address.

---

## 9. Architectural Decisions & Rationale

| Decision | Rationale |
|---|---|
| **Single Next.js app, not separate deployed services** | At this scale (hundreds–low thousands of beneficiaries), splitting into separately deployed public/member/admin apps would multiply auth complexity (cross-app session sharing), multiply DB connection pool pressure, and multiply deploy/debug surface — solving organizational problems the project doesn't have while making the actual pain points (auth bugs, review gaps) worse, not better. |
| **Better Auth for both members and admins** | One auth system, one session model, one place to get security right — rather than maintaining two auth systems that must be kept in sync. |
| **Server-side file uploads with service role key** | Supabase Storage RLS cannot use Better Auth sessions (no `auth.uid()`), so client-side RLS is not a viable access-control layer here; the app's own auth check, enforced server-side, is the real control. |
| **Prisma-layer access control over Postgres RLS generally** | Consistent with the Storage decision above — one access-control model (app-layer) across the whole system, not a mix of DB-level and app-level enforcement that can drift out of sync. |
| **@react-pdf/renderer over jsPDF for certificates** | Declarative, component-based layout handles the certificate's actual requirements (centering, QR code, bilingual text) more reliably than jsPDF's manual coordinate placement. |
| **Separate PAN/Aadhaar storage buckets** | Avoids mixing distinct sensitive-document types under one ambiguous bucket name — found during audit as a data-organization/security concern. |
| **Broad middleware matcher patterns (`/admin/:path*`) over per-route lists** | A prior incident where newly added routes were missed from route protection (resulting in unauthenticated access to admin/dashboard pages) directly motivated this — broad patterns fail safe by default for new routes. |

---

## 10. Known Technical Debt / In Progress

- **Multilingual coverage**: next-intl is configured and working for priority pages (login, signup, dashboard home, enrollment form); full-site coverage is incremental. Hindi/Marathi translations are AI-assisted and require native-speaker review before being considered production-accurate.
- **Sentry**: configured but using placeholder project/org credentials; error tracking is currently non-functional. Low priority — to be connected once a real Sentry account/project is set up.
- **UI/UX pass**: dashboard and admin panel visual redesign (blue/white minimalist theme) is being applied incrementally, page by page, without altering underlying business logic.
- **Test coverage**: Vitest infrastructure exists; coverage is not yet comprehensive across all Server Actions.

---

## 11. Development Process & Change Discipline

Given prior incidents (an authentication bypass regression introduced during a large, multi-area rebuild), the project follows a **staged, single-domain-at-a-time change process**:

1. Schema changes are proposed, migrated, and verified in isolation before any business logic changes.
2. Business logic changes are scoped to one domain at a time (e.g. auth, then member-facing actions, then admin actions) — not rebuilt all at once.
3. Every change is verified with actual browser-based testing (Playwright) before being considered complete — not just a code-level review.
4. Auth/session/role-check logic is treated as especially high-risk: any change touching `proxy.ts`, `session.ts`, or `requireAuth()`/`requireAdmin()` requires an explicit unauthenticated-access re-test across all protected routes before merging.
5. Large "rebuild everything" requests to AI coding agents are avoided in favor of smaller, independently verifiable steps.

---

## 12. Environment Variables (reference — do not commit real values)

```
DATABASE_URL=                    # Supabase pooled connection (runtime)
DIRECT_URL=                      # Supabase direct connection (migrations only)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=       # server-only, never exposed to client
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
RESEND_API_KEY=
SENTRY_DSN=                      # currently placeholder
NEXT_PUBLIC_APP_URL=
```

---

*This document reflects confirmed architectural decisions as of the last update. It should be revised whenever a decision in Section 9 is revisited, or when a new domain is added to the system.*
