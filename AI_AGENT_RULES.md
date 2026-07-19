# AI Agent Rules — CompassionGlobal NGO ERP

**Purpose:** These are binding operating rules for any AI coding agent (OpenCode, Claude Code, Freebuff, Antigravity, or any other) working on this project. Read this file AND `ARCHITECTURE.md` in full before making any change. If a request conflicts with these rules, follow these rules and flag the conflict to the user rather than silently picking one.

---

## 1. Architecture compliance — non-negotiable

- **Always follow `ARCHITECTURE.md`.** Every decision in that document (single Next.js app, Better Auth for both member/admin, server-side uploads via service role key, Prisma-layer access control, `@react-pdf/renderer` for certificates, broad middleware matchers, etc.) is settled. Do not propose alternatives to settled architecture decisions unless the user explicitly asks you to reconsider one.
- If a task seems to require deviating from `ARCHITECTURE.md`, **stop and ask** before proceeding — do not silently make the change and explain it afterward.
- Never introduce a second auth system, a second database access pattern, or a second deployed service "to make this one thing easier." Solve the problem within the existing architecture.

---

## 2. Every function must be fully working — no partial implementations

- A function is not "done" until it actually works end-to-end, not until it type-checks or looks plausible.
- Never leave a function that returns mock/placeholder data while pretending it's real, unless explicitly asked to stub something for later.
- Never leave a button, form, or UI action that doesn't actually do what it visually claims to do (a "Save" button must actually save; an "Approve" button must actually approve).
- If a feature genuinely cannot be completed in the current step (e.g. depends on something not yet built), say so explicitly — do not silently ship a non-functional version and call it complete.
- After writing any function, verify it actually works via a real test (Playwright browser test for UI flows, a direct call/script for backend logic) before reporting it as done. Code that "should work" based on reading it is not verified.

---

## 3. No duplicate code

- Before writing a new function, **search the codebase** for an existing function that already does this or something close to it. If one exists, use/extend it rather than writing a new one.
- Never redefine the same logic in multiple files. Examples that are explicitly forbidden going forward: multiple local copies of `requireAdmin()`/`requireAuth()`, multiple certificate-numbering implementations, multiple `deleteMember()`-style functions with slightly different behavior.
- Shared logic (auth checks, validation schemas, formatting helpers, status-label mappings, etc.) belongs in one shared location (`src/lib/`) and must be imported everywhere it's needed — never copy-pasted.
- If you find existing duplicate code while working on something else, flag it to the user rather than adding a third copy on top.

---

## 4. Optimized code

- Prefer the existing, established pattern already used elsewhere in this codebase over inventing a new pattern, unless the existing pattern is confirmed broken.
- Avoid unnecessary re-renders, redundant database queries (check for N+1 patterns — use Prisma `include`/`select` instead of looping queries), and redundant network calls (don't fetch data the component already has access to).
- Avoid unnecessary client-side JavaScript for things that can be done server-side (Server Components, Server Actions) — this project defaults to server-first per the Next.js App Router architecture already in place.
- Keep bundle size in mind: don't import an entire library for one small utility if a lighter option or a few lines of native code will do.
- Database queries must use existing indexes where available (see `ARCHITECTURE.md` Section 5.4) — do not write queries that force full table scans on indexed columns.

---

## 5. Do not make the system more complex than it needs to be

- Default to the simplest solution that correctly solves the actual problem. Do not add abstraction layers, new libraries, new services, or new architectural patterns "for future flexibility" unless the user explicitly asks for that flexibility now.
- Do not introduce a new state management library, a new API layer, a new folder structure convention, or a new naming convention that diverges from what's already established in this codebase.
- If you're about to add a new dependency, first check whether something already in `package.json` can do the job.
- Prefer editing/extending an existing file over creating a new one, when the new logic clearly belongs with existing related logic.
- If a task can be done in a small, targeted change vs a broad refactor, do the small, targeted change — even if the broad refactor feels "more correct" in the abstract. Broad, sweeping changes are the direct cause of the most serious bug this project has had (an authentication bypass introduced during a large multi-area rebuild) — see Section 11 of `ARCHITECTURE.md`.

---

## 6. Change size and process discipline

- **One domain at a time.** Do not combine unrelated changes (e.g. UI redesign + new feature + bug fix) into a single pass. If a user's request spans multiple domains, say so and propose splitting it into sequential steps.
- Before making any change touching authentication, `proxy.ts`, session handling, or role checks: explicitly flag this as high-risk, and after the change, re-test unauthenticated access to ALL protected routes (`/admin/*`, `/dashboard/*`) before reporting the task complete — not just the specific route that was touched.
- Show what changed, not just that something changed. When reporting completion, name the specific files modified and what changed in each — do not give a vague summary like "fixed the issue" without specifics.
- Never report a task as "fully working" or "production ready" unless it was actually tested via a real browser/tool interaction (Playwright or equivalent) — reasoning about the code being correct is not the same as verifying it.

---

## 7. Schema and data integrity

- Never invent new field names that don't match `schema.prisma`. Read the actual current schema before writing any code that reads/writes the database.
- Never modify `schema.prisma` without first checking for existing data that could be affected (orphaned records, cascade deletes) and reporting findings to the user before applying a migration.
- Always generate a proper Prisma migration for schema changes — never edit the database directly outside of migrations.
- Respect the `onDelete` rules already established (`Restrict` for certificates and courses with dependent records) — do not loosen these to `Cascade` to make a delete operation "just work," since that was a previously-identified data-loss risk.

---

## 8. Security defaults

- Never weaken, remove, or bypass an existing validation, auth check, or security control while fixing something unrelated — if a security control is genuinely getting in the way of a legitimate change, flag it to the user explicitly rather than quietly loosening it.
- All file uploads go through server-side validation (type, size, magic bytes) and the service-role-key pattern already established — never add a client-side-only upload path.
- Never expose the Supabase service role key, database credentials, or any secret to client-side code.
- Sensitive documents (Aadhaar, PAN, Ration Card) are never returned via permanent public URLs — only time-limited signed URLs, generated server-side after an authorization check.

---

## 9. Honesty over completion pressure

- If something is not fully working, say so clearly — do not present partial or untested work as complete to appear more helpful.
- If a request is ambiguous or could be interpreted multiple ways in a way that matters (e.g. affects data, security, or user-facing behavior), ask rather than guessing and proceeding.
- If you notice a conflict between what the user is asking for right now and something in `ARCHITECTURE.md`, name the conflict directly instead of silently complying or silently ignoring the request.

---

## 10. Definition of "done" (applies to every task)

A task is only complete when ALL of the following are true:
1. It follows `ARCHITECTURE.md` — no unapproved architectural deviation.
2. It does not duplicate existing logic — reused what already existed where possible.
3. It was actually tested (not just reasoned about) and confirmed working.
4. `npx tsc --noEmit` and `npx next build` both run clean (no new errors introduced).
5. No existing functionality was broken as a side effect (spot-check adjacent features if the change touches shared code like auth, session, or layout).
6. The change was reported specifically — what files changed, what was tested, what the result was — not vaguely.

---

*This file works together with `ARCHITECTURE.md`. Read both before starting any task on this project.*
