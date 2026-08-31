# CompassionGlobal / RMVS NGO ERP — Agent Memory

## Project Overview
- **Full name:** Rupasri Mahila Vikas Sanstha (RMVS) — CompassionGlobal NGO ERP
- **Stack:** Next.js 15.4.9 (App Router) + TypeScript 5.9.3 + React 19 + Tailwind CSS v4 + Prisma 6.19.3 + Better Auth 1.6.23 + Supabase (PostgreSQL + Storage)
- **Working directory:** `C:\Users\Aryan\OneDrive\Desktop\ngo_website\next_rmvs\`
- **Maintained by:** Aryan Navale
- **Database:** Supabase Postgres — pooled (port 6543, pgbouncer) for runtime, direct (port 5432) for migrations

## Key Commands
- `npx tsc --noEmit` — TypeScript check (0 errors expected)
- `npm run build` — Production build
- `npm run dev` — Dev server (Turbopack)
- `npm run seed` — Seed database (creates superadmin + test member)
- `npx prisma db push` — Push schema changes
- `npx prisma generate` — Generate Prisma client

## Environment Variables
- See `.env.example` for all required vars
- Key secrets: `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RESEND_API_KEY`
- `SUPERADMIN_PASSWORD` — bootstrap only, destroy after first login
- `TRUSTED_PROXY_HOPS` — default 1 for Vercel, 0 for self-hosted

## Architecture Decisions (Settled)
1. **Single Next.js app** — not separate deployed services (deliberate choice per ARCHITECTURE.md Section 9)
2. **Better Auth for both members and admins** — one system, one session model
3. **Server-side file uploads** via service role key — Supabase RLS can't use Better Auth sessions
4. **Prisma-layer access control** — not Postgres RLS (consistent with Storage decision)
5. **@react-pdf/renderer for certificates** — declarative > coordinate-based (jsPDF)
6. **Broad middleware matchers** (`/admin/:path*`) — fail-safe for new routes
7. **Soft-delete pattern** — profiles, leaders, blog_posts, teachers all use status='deleted'
8. **Postgres-backed rate limiting** — `rate_limit_entries` table + in-memory fast-path

## Auth Architecture
- Better Auth handles both member and admin auth (single `User`/`Account`/`Session` tables)
- Separate login pages (`/login`, `/admin/login`) hit same backend
- `User.role` (MEMBER|ADMIN) for auth gating; `profiles.role` (member|admin|staff|volunteer) for business logic — intentionally independent
- Mandatory TOTP 2FA for all admin accounts
- Step-up verification for sensitive actions (15-min window)
- `requireAuth()`, `requireAdmin()`, `requireStepUp()` in `lib/session.ts`
- Force password change mechanism for superadmin bootstrap

## Database
- 48 Prisma models, 31 enums, 20 migrations
- Key groups: Identity, Beneficiary, Training, Certification, Teachers, Coupons, CMS, Activity, Settings, Donations
- Compound unique constraints: `CourseApplication(profileId, courseId)`, `CourseEnrollment(profileId, courseId)`
- `profiles.id` → `User.id` (ON DELETE CASCADE) — FK added after Better Auth init
- Certificates use ON DELETE Restrict (legal documents)

## File Structure
- `app/(public)/` — 14 public pages (home, about, programs, programs/[slug], impact, resources, volunteer, donate, contact, offices, privacy, terms, unsubscribe, code-of-conduct)
- `app/(dashboard)/` — 10 member dashboard pages
- `app/admin/` — 19 admin pages (login, setup-2fa, verify-2fa, verify-stepup, protected layout with 15 pages)
- `app/api/` — 94 API routes (~70 admin, 8 public, 3 dashboard, 2 donations, 1 webhook, etc.)
- `components/` — 32 components (12 UI primitives, 4 public, 16 domain-specific)
- `lib/` — 55 files (auth, contexts, validations, hooks, enrollment domain)
- `prisma/` — Schema + 20 migrations + seed scripts
- `tests/` — 8 Playwright specs + 5 Vitest unit tests
- `scripts/` — 14 DB maintenance/backfill scripts

## Known Issues (Current)
- `lib/api-error.ts` — 8 helpers defined but 0 imported (dead code)
- 60 residual `any` types (mostly `catch (e: any)` + Prisma mappers)
- `lib/store.ts` marked `@deprecated` but still imported for types
- Dead dependencies: `@google/genai`, `firebase-tools` (zero imports)
- `next-intl` mentioned in ARCHITECTURE.md but NOT installed (hand-rolled localStorage i18n instead)
- `README.md` still references Google AI Studio origin
- ARCHITECTURE.md says "Next.js 16.x" but package.json has 15.4.9
- 9 debug scripts + stray artifacts in repo root
- Dual lockfiles: `bun.lock` + `package-lock.json`

## Project Status (August 20, 2026)
- **~90% complete** — all core features built and wired to real DB
- Remaining: env credentials, testing, i18n, deployment
- All 42 original audit issues addressed
- Full report: `PROJECT_STATUS.md`

## PowerShell Notes
- Environment: Windows, PowerShell 5.1
- Use `;` not `&&` for command chaining
- `Get-Process -Name "node" | Stop-Process -Force` before tsc/build if dev server is running
- `prisma db execute` has BOM issues with PowerShell `Out-File` — use `[System.IO.File]::WriteAllText()` instead
- Dev server DLL lock issue: must kill node processes before running tsc/prisma
