# PLAN.md — CompassionGlobal / RMVS NGO Platform
## Roadmap: Prototype → Production

**Based on:** Current project status report (React 19 + Vite prototype, dated this session) evaluated against `ARCHITECTURE.md` (target: Next.js App Router + Prisma + Supabase + Better Auth).

---

## 0. Reality Check First — read this before Phase 1

Your current build and your target architecture are **two different frameworks**, not one project at different stages:

| | Current state | Target (ARCHITECTURE.md) |
|---|---|---|
| Framework | React 19 + Vite 6.4 (SPA) | Next.js 16 App Router |
| Routing | Manual state-based (no router) | File-based routing, real URLs |
| Backend | None — hardcoded mock data | Prisma + Supabase Postgres |
| Auth | Hardcoded admin credentials | Better Auth |
| Rendering | Client-only | Server Components + Server Actions |

**This is not a "connect the backend" task — it is a migration.** You cannot bolt Prisma/Better Auth/Server Actions onto a Vite SPA; Server Actions and Server Components are Next.js-specific. The honest options are:

- **Option A (recommended):** Treat the current Vite build as a **finished design reference** — keep it running untouched as your visual source of truth, and rebuild page-by-page inside your real Next.js project (the one already following `ARCHITECTURE.md`), porting UI/JSX/Tailwind classes directly (this part copies over easily) while wiring each page to real Server Actions instead of mock data.
- **Option B:** Migrate the Vite project to Next.js in place (via `next.config`, restructuring `src/pages`→`app/`, converting routing). This is more mechanical but riskier — Vite→Next.js migrations commonly surface subtle issues (env var handling, routing edge cases, build tooling differences) that are easy to underestimate.

**This plan assumes Option A**, since you already have a working Next.js project (per `ARCHITECTURE.md`) with real Prisma/Better Auth wiring in progress — porting UI into that project is far lower-risk than migrating the Vite project's tooling.

If you actually want Option B instead, stop and say so before starting Phase 1 — the plan below would need to change.

---

## Phase 1 — Lock down security & stop active risk (Do this first, before any porting)

**Goal:** The current prototype has a hardcoded admin password. Even as a demo, this must not be reachable publicly.

- [ ] Confirm the Vite prototype is NOT deployed anywhere publicly accessible, or if it is, take it down / restrict access immediately.
- [ ] Remove the hardcoded credentials from `AdminLogin.tsx` regardless — even in a local demo, hardcoded secrets are a habit to break now, not later.
- [ ] Remove unused dependencies causing confusion: `@google/genai`, `express`, `dotenv` (unused server deps) — clean these out of `package.json` since they're not part of the real target architecture and are dead weight.
- [ ] Fix the duplicated `react` + `vite` entries appearing in both `dependencies` and `devDependencies`.

**Exit criteria:** No secrets in source code. Dependencies list only reflects what's actually used.

---

## Phase 2 — Inventory & mapping (no code changes yet)

**Goal:** Know exactly what maps to what before touching anything, per `AI_AGENT_RULES.md` Section 6 (no broad changes without a plan).

- [ ] List every one of the 21 pages (9 member + 12 admin) and map each to its target route per `ARCHITECTURE.md` Section 3 (e.g. `Dashboard.tsx` → `/dashboard`, `AdminLogin.tsx` → `/admin/login`).
- [ ] For each page, list what mock data it currently reads from `data.ts`/`mockAdminData.ts`, and identify the corresponding real Prisma model(s) from `ARCHITECTURE.md` Section 5.
- [ ] List every shared component (Sidebar, Header, Skeletons, AdminLayout) and confirm whether an equivalent already exists in the real Next.js project, or needs to be ported fresh.
- [ ] Identify components using `Context API` (`AdminContext`) — these will need to be re-evaluated, since the target architecture favors Server Components/Server Actions over client-side global state where possible (per `AI_AGENT_RULES.md` Section 4 — prefer server-first).

**Exit criteria:** A page-by-page, component-by-component mapping table exists and is reviewed before Phase 3 begins.

---

## Phase 3 — Port UI, one page at a time, still on mock data

**Goal:** Get every page visually rendering inside the real Next.js project, using the correct route, but still reading from local mock data — functionality wiring comes in Phase 4. This isolates "does the UI port correctly" from "does the real backend work correctly," so problems in one don't get confused with problems in the other.

**Order (public site is already done per your last message — this phase covers Dashboard + Admin):**

1. Shared components first: Sidebar, Header, Skeletons, layout wrappers — ported once, reused everywhere (per `AI_AGENT_RULES.md` Section 3, no duplicate component logic across pages).
2. Member Portal pages, in this order: Dashboard → Profile → Training (browse) → Course Detail → Apply → Applications → Certificates → Notifications → Activity.
3. Admin Portal pages, in this order: Login → Dashboard → Members → Teachers → Training → Enrollments → Certificates → Coupons → Notifications → Activity Logs → Website Content → Settings.

For each page:
- [ ] Port JSX/Tailwind classes into the correct Next.js route file.
- [ ] Confirm it renders correctly (visual match to the Vite version).
- [ ] Confirm responsive behavior still works (mobile/tablet/desktop).
- [ ] Move to the next page only after the current one renders correctly — no batching multiple pages into one pass (per `AI_AGENT_RULES.md` Section 6).

**Exit criteria:** All 21 pages render correctly inside the real Next.js project, on their correct routes, still using mock data. `npx tsc --noEmit` and `npx next build` both clean.

---

## Phase 4 — Wire real backend, one domain at a time

**Goal:** Replace mock data with real Prisma/Server Action-backed data, domain by domain, each fully tested before moving to the next — this is the highest-risk phase and must follow the staged process exactly (this is the same discipline that prevents another auth-bypass-style regression).

**Order (simplest/lowest-risk domains first):**

1. **Auth** — Better Auth wired for both member and admin login, replacing any mock/hardcoded login logic entirely. Verify: signup, login, logout, session persistence, rate limiting. Re-verify unauthenticated access is blocked on ALL routes (per `AI_AGENT_RULES.md` Section 6).
2. **Profile** — real `profiles` data, document upload wired to the real server-side upload pipeline (Section 6 of `ARCHITECTURE.md`).
3. **Course browsing (public + member)** — real `courses` data from Prisma, replacing `data.ts` course arrays.
4. **Course application flow** — the full flow from `ARCHITECTURE.md` Section 7: profile completeness check → dynamic field config → coupon validation → application submission.
5. **Admin: Members management** — real CRUD against `profiles`/`beneficiary_*` tables.
6. **Admin: Teachers management** — real CRUD.
7. **Admin: Course management (9-step wizard)** — real course creation, including the teacher-dropdown (not free text) and inline coupon creation.
8. **Admin: Application approval → enrollment** — the critical cross-system reflection: admin approves → real enrollment created → member dashboard reflects it (test with two parallel Playwright browser contexts, per prior test prompts).
9. **Certificates** — real generation via `@react-pdf/renderer`, storage, and the public `/verify` route.
10. **Coupons** — real CRUD and redemption validation.
11. **Notifications** — real broadcast + per-user notification records.
12. **Activity Logs** — real audit trail.
13. **Website Content (CMS)** — real CRUD affecting the public site.
14. **Settings** — real persisted settings.

For each domain:
- [ ] Read the relevant Prisma models fully before writing any Server Action (per `AI_AGENT_RULES.md` Section 7 — never invent field names).
- [ ] Implement Server Actions, reusing the shared `requireAuth()`/`requireAdmin()` utility (never redefine locally).
- [ ] Replace the page's mock data calls with real Server Action calls.
- [ ] Test with Playwright — both the happy path and at least one edge case (empty state, validation error, duplicate submission).
- [ ] Confirm no console errors, `npx tsc --noEmit` and `npx next build` clean.
- [ ] Only then move to the next domain.

**Exit criteria:** Every domain listed above is running on real data, individually tested, with zero remaining mock data imports in the codebase.

---

## Phase 5 — Performance & code quality cleanup

**Goal:** Address the specific issues flagged in the status report, now that real functionality exists to optimize.

- [ ] Code splitting / lazy loading for admin routes (per Next.js App Router conventions — this is largely automatic with the App Router's per-route bundling, but confirm no single client component is pulling in unnecessary weight, e.g. chart libraries loaded on pages that don't need them).
- [ ] Remove artificial `setTimeout` loading delays — real Server Actions have real latency; fake delays are unnecessary once real data fetching exists.
- [ ] Audit bundle size post-port — confirm no regression back toward the prior 772 KB single-chunk problem (Next.js App Router should avoid this by default via route-level code splitting, but verify).
- [ ] Re-evaluate any remaining `Context API` usage — replace with Server Component data fetching where the data doesn't need to be client-interactive.

**Exit criteria:** No artificial delays remain. No single route bundle is unreasonably large. No unused dependencies remain.

---

## Phase 6 — Multilingual (English/Hindi/Marathi)

**Goal:** The Vite prototype already has trilingual support — this needs to be re-implemented using `next-intl` per `ARCHITECTURE.md`, not ported as-is (since the underlying i18n mechanism differs between a Vite SPA and Next.js Server/Client Components).

- [ ] Confirm which pages the Vite prototype already has translated, and use that as the content source (don't re-translate from scratch if it already exists).
- [ ] Wire translations into the Next.js `next-intl` setup already established, prioritizing the pages `ARCHITECTURE.md` flags as priority (login, signup, dashboard home, enrollment form) first, then expand.
- [ ] Flag AI-assisted Hindi/Marathi translations for native-speaker review before treating them as final (per `ARCHITECTURE.md` Section 10).

**Exit criteria:** Priority pages fully trilingual and verified in-browser; broader coverage tracked as ongoing, not blocking.

---

## Phase 7 — Testing infrastructure

**Goal:** The status report notes zero tests exist. Establish baseline coverage now that real logic exists to test.

- [ ] Set up Vitest properly in the Next.js project (add the missing `test` script, per audit finding L-06).
- [ ] Write tests for the highest-risk logic first: auth/session checks, coupon validation logic, application-to-enrollment approval flow.
- [ ] Establish a Playwright test suite covering the full end-to-end flow from `ARCHITECTURE.md` Section 7 as a standing regression check — re-run this after any future significant change.

**Exit criteria:** Core business logic has test coverage; the end-to-end Playwright flow can be re-run on demand as a regression gate.

---

## Phase 8 — Production readiness checklist

**Goal:** Final pass before this goes live for real beneficiaries.

- [ ] All environment variables set on Vercel with real values (no placeholders) — including Sentry, if being used (per `ARCHITECTURE.md` Section 10, currently placeholder).
- [ ] `.env.local` actually exists and is populated (status report flags this as missing — only `.env.example` present).
- [ ] Database backup taken before any real beneficiary data is entered.
- [ ] Full unauthenticated-access re-test across every route (per `AI_AGENT_RULES.md` Section 6).
- [ ] Full end-to-end flow (Phase 7's Playwright suite) passes cleanly.
- [ ] Real Hindi/Marathi translations reviewed by a native speaker for priority pages.
- [ ] Soft-launch with 2-3 real test users before opening broadly, per earlier guidance.

**Exit criteria:** Every box above checked. Only then is this "production ready."

---

## How to actually execute this plan

- Work through phases **in order** — do not skip ahead to Phase 4 (backend wiring) while Phase 3 (UI porting) is incomplete; you'll lose the ability to isolate whether a bug is a porting issue or a backend issue.
- Within Phase 3 and Phase 4, work through the listed order **one item at a time**, verify, then move to the next — this is not optional, it is the specific discipline that prevents another regression like the prior auth bypass.
- Give the agent `ARCHITECTURE.md`, `AI_AGENT_RULES.md`, and this `PLAN.md` at the start of every session, and tell it explicitly which phase/item you're currently on — do not let it jump ahead or combine steps "for efficiency."
- Update the checkboxes in this file as you go — it should reflect real current progress, not be written once and forgotten.

---

*This plan will need revision once Phase 2's actual page-by-page mapping is complete — some pages may reveal additional complexity not visible from the status report alone. Treat this as the current best plan, not a fixed contract.*
