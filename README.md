# CompassionGlobal / RMVS — NGO ERP & Public Website

Production web platform for **CompassionGlobal**, an NGO focused on skill development. It combines a public-facing NGO website with a member portal and an administrative ERP for managing beneficiaries, training programs, enrollments, certificates, coupons, donations, and content.

Built with the App Router (Next.js), Prisma, PostgreSQL (Supabase), and Better Auth.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, `output: standalone`) |
| Language / UI | TypeScript (strict) · React 19 · Tailwind CSS v4 |
| ORM / DB | Prisma 6 · PostgreSQL (Supabase) |
| Auth | Better Auth (email/password, TOTP 2FA, step-up) |
| Storage | Supabase Storage (private buckets, signed URLs) |
| Payments | Razorpay (create-order → verify → webhook) |
| Email | Resend (transactional) |
| CAPTCHA | Cloudflare Turnstile |
| PDF | @react-pdf/renderer |
| Testing | Vitest (unit) · Playwright (E2E) |

---

## Getting Started

**Prerequisites:** Node.js 20+, a PostgreSQL database (Supabase recommended), and the third-party keys listed under **Environment Variables**.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
#    For a full production config reference see "Environment Variables" below.

# 3. Apply the database schema (Prisma migrations)
npx prisma migrate deploy

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> The app intentionally connects via `DIRECT_URL` (session-mode pooler, port `5432`) rather than the transaction-mode pooled `DATABASE_URL` (port `6543`), which some networks cannot reach. `lib/prisma.ts` sets this explicitly.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Start the production server (`next start`) |
| `npm run lint` | ESLint (`eslint .`) |
| `npx tsc --noEmit` | TypeScript type-check |
| `npm test` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run seed` | Seed the database |
| `npm run seed:certificates` | Seed sample certificates |

---

## Project Structure

```
app/
  (public)/          Public marketing pages (home, about, programs, impact, …)
  (dashboard)/       Member portal (profile, training, applications, …)
  admin/             Admin ERP (members, teachers, courses, enrollments, certificates, …)
  api/               Backend API routes (auth, admin, public, donate, webhooks, …)
components/          Reusable UI + domain components
lib/                 Auth, Prisma, file-validation, rate-limit, SEO, org-config, …
prisma/              Schema, seed scripts, and migrations
tests/               Playwright E2E specs
__tests__/           Vitest unit tests
```

---

## Core Business Flow — Course Enrollment

1. Admin creates a course via the 9-step wizard → **Draft**.
2. Admin publishes → visible to members.
3. Member browses `/dashboard/training`, sees published courses with seat availability.
4. Profile completeness is checked before applying.
5. Application form renders dynamically from `course_field_config`.
6. Optional coupon validation.
7. Application submitted → `pending`.
8. Admin approves at `/admin/training/[courseId]` → enrollment created, seat decremented, notification sent.
9. Attendance/completion tracking determines certificate eligibility.
10. Certificate is generated server-side (PDF), stored in Supabase Storage.
11. Public verification via `/verify/<certificateNumber>`.

---

## Security

- **Two layers of auth checks**: Edge middleware plus server-side `requireAuth` / `requireAdmin` / `requireStepUp` on every route and admin API.
- **TOTP 2FA** enforced for admin accounts (setup + verification flows in `/admin/setup-2fa`, `/admin/verify-2fa`).
- **Step-up re-authentication** for sensitive admin actions (15-minute window).
- **Postgres-backed rate limiting** (`rate_limit_entries`), trusted-proxy aware IP extraction.
- **Email uniqueness enforced at the DB level** (`User_email_key` unique index) in addition to Better Auth's application check.
- **File uploads** are server-side only: magic-byte validation, compression (`sharp`), private buckets, 1-hour signed URLs.
- **Razorpay webhook** is signature-verified.
- **3-layer password validation** (client + server create + server update).

---

## Environment Variables

Create `.env.local` from the values below (see `.env.example`). **Never commit real secrets.**

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase pooled connection (`:6543`) |
| `DIRECT_URL` | Supabase direct/session connection (`:5432`) |
| `SHADOW_DATABASE_URL` | Prisma shadow database (dev migrations) |
| `BETTER_AUTH_URL` / `NEXT_PUBLIC_BETTER_AUTH_URL` | Auth base URL |
| `BETTER_AUTH_SECRET` | Session signing (≥32 chars) |
| `TRUSTED_ORIGINS` | CORS origins |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase project + storage |
| `SUPERADMIN_PASSWORD` | Bootstrap only — destroy after first login |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Payments |
| `RESEND_API_KEY` | Transactional email |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | CAPTCHA |
| `TRUSTED_PROXY_HOPS` | IP extraction behind a reverse proxy (default `1`) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (used for SEO/sitemap) |

---

## Deployment

The app builds with `output: 'standalone'`, so it is container/deployment-platform friendly (Vercel, Docker, etc.).

```bash
npm run build
npm start
```

Before a production launch:

- [ ] Set all env credentials in the deployment platform
- [ ] `npx prisma migrate deploy` against the production database
- [ ] `npx prisma generate` after any schema change
- [ ] Seed production data
- [ ] First admin login → forced password change → set up TOTP 2FA
- [ ] Destroy the `SUPERADMIN_PASSWORD` env var

---

## Documentation

- `PROJECT_STATUS.md` — project-wide status and audit report
- `ARCHITECTURE.md` — architecture overview
- `ADMIN_AUDIT.md` — admin/security audit notes
- `WEBSITE_AUDIT_REPORT.md` — original website audit (historical)
- `AI_AGENT_RULES.md` — conventions for automated agents working in this repo
