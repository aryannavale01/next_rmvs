# Admin Panel Security & Quality Audit — `next_rmvs`

Read-only audit of the Next.js 15 App Router admin panel (pages + API routes).
This document records all findings with file paths, line numbers, quoted code, and severity.

---

## 1. Confirmed Findings

### 1.1 Open Redirect on Step-Up form (client-side) — MEDIUM

`app/admin/verify-stepup/step-up-form.tsx:11,42`

The `returnTo` query param is read from the URL and passed **directly** to `router.push` with no `isSafeRedirect` validation:

```ts
// line 11
const returnTo = searchParams.get('returnTo') || '/admin';
...
// line 42
router.push(returnTo);
```

- The `lib/redirect.ts` `isSafeRedirect(url, fallback)` helper already exists (rejects non-relative `/`, `//`, `[a-zA-Z]:` URLs) but is **not used here**.
- Other forms (the login form) do use `isSafeRedirect` — so this file is inconsistent with the existing safe pattern.
- Impact is limited (page is behind auth), but a logged-in admin can be sent to an attacker-controlled external URL via a crafted `returnTo` link (e.g. `https://evil.com` if a relative URL is not required by the router). Fix by passing `returnTo` through `isSafeRedirect(returnTo, '/admin')`.

### 1.2 `loadData` is undefined on Retry button — HIGH (bug / broken UI)

`app/admin/(protected)/enrollments/page.tsx:113`

The retry button calls `loadData()`, but no `loadData` function is defined anywhere in the file (confirmed by reading the whole file). Clicking "Retry" throws `ReferenceError: loadData is not defined` and the page's error state is never cleared.

```tsx
// line ~109-115 (paraphrased structure)
{error && (
  <button onClick={loadData} ...>Retry</button>
)}
```

Compare with `app/admin/(protected)/certificates/page.tsx`, which correctly defines `loadData` and has a full error UI. Recommendation: rename the handler to the actual function used to reload data, or remove the button.

### 1.3 Silent `catch(() => {})` in bulk volunteer assignment — MEDIUM (data-not-saved, silent)

`components/NextJSBeneficiaryDirectory.tsx:588-595`

```tsx
const handleBulkAssignVolunteer = () => {
  if (!bulkActionVolunteer) return;
  selectedIds.forEach(id => {
    updateMember(id, { assignedVolunteer: bulkActionVolunteer }).catch(() => {});
  });
  ...
};
```

Per-member `updateMember` failures are **silently swallowed** with `.catch(() => {})`. The UI shows success (selection cleared, toast) even when zero/none of the updates persisted; the operator cannot tell which beneficiaries failed. Also no confirmation dialog, and no `requireStepUpClient` gate. Fix: `Promise.allSettled`, collect failures, surface a count of failures, and gate with step-up.

### 1.4 Hardcoded geo defaults + hardcoded date cutoff — LOW/MEDIUM (quality/correctness)

`components/NextJSBeneficiaryDirectory.tsx:186-188,200,215`

```tsx
// line 186-188 default new-member form
district: 'Satara',
state: 'Maharashtra',
village: 'Satara Rural',
...
// line 200
const recentCount = members.filter(m => m.createdAt >= '2026-05-01').length;
// line 215
else if (metricFilter === 'recent') result = result.filter(m => m.createdAt >= '2026-05-01');
```

- Geographic defaults are hardcoded to a specific location, so a fresh form anywhere else records wrong data unless the operator edits every field.
- The "recent members" cutoff `'2026-05-01'` is a hardcoded date constant duplicated in two places; it becomes stale and is not derived from `now - N days`. The `'recent'` stat label and filter and `recentCount` can drift out of sync.

### 1.5 SMTP password exposed to the client — HIGH

`app/admin/(protected)/settings/page.tsx:20-25`

The settings page passes `process.env.SMTP_PASS` (the mailer SMTP password) into client props so the settings form can render it back into the password field:

```tsx
const props = {
  email: {
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: process.env.SMTP_PORT || '',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',   // <-- secret shipped to browser
    senderName: 'NGO Skill Coordinator',
    senderEmail: 'coordinator@compassionglobal.org',
  },
};
```

Even though `NEXT_PUBLIC_`-prefixed env is normally needed to expose vars to the client bundle, passing `process.env.SMTP_PASS` through a Server Component's props **does** bake the literal secret value into the serialized RSC payload / page HTML, making it visible in `view-source` / devtools. This is a credential disclosure. Recommendation: never return the SMTP password from the server; let the UI update it but never echo an existing secret (return a boolean "isConfigured" instead).

### 1.6 Website-content tabs: no fetch error UI + no client step-up gate — MEDIUM

`app/admin/(protected)/website-content/locations-tab.tsx:28` (representative of several tabs)

```tsx
fetch('/api/admin/website-content/locations')
  .then(r => r.json())
  .then(d => setItems(d.data || []))   // no .catch, no error state
```

- Initial fetch has **no `.catch`** and no error UI, so a failed/401 load is silently an empty list.
- Save/delete handlers rely only on `res.ok` with no toast on `!res.ok`, and generally do **not** call `requireStepUpClient(...)` before sensitive writes — so the step-up prompt only appears if the API returns the step-up-required shape, which is inconsistent across tabs (some call step-up, some don't). This creates inconsistent client behavior for `manage_website_content`-class actions.

### 1.7 Activity logs page 500s on DB error — LOW/MEDIUM

`app/admin/(protected)/activity-logs/page.tsx`

`getRecentActivity(100)` is called at render without a try/catch, so a DB failure throws and the page renders a 500 with no error UI. Compare `certificates/page.tsx`, which correctly wraps data loading with `loadData()` + retry + error UI.

---

## 2. Rate-Limiting Gaps

`checkRateLimit(...)` is used only in: `certificates/download`, `certificates/generate`, `force-password-change`, `members/bulk-import`, `members/export`, `newsletters/[id]/send`, `sessions/revoke-all`, `sessions/[userId]/revoke`, `verify-stepup`.

Missing rate limiting on other **sensitive/expensive writes**:
- `site-settings` bulk / `[id]` / POST (system settings change)
- `coupons` create / PATCH / DELETE (`manage_coupons`)
- `notifications` POST (broadcast to all users) — high-volume spam/abuse vector
- `cms-images/upload`
- All `website-content/*` write routes (leaders, gallery, programs, milestones, partners, locations, testimonials, blog-posts, org-documents)
- `teachers`, `members` create/update
- `enrollments` approve/reject/bulk

Finding: sensitive actions (esp. broadcast notification, coupon changes) lack brute-force/abuse throttling even though the infra (`checkRateLimit`) exists.

---

## 3. Code Quality

- **Pervasive `any` typing** in API mappers: `mapCoupon(c: any)`, `mapProfile(p: any)`, `mapTeacher(t: any)`, `body.coupons.map((c: any) => ...)`, `catch (err: any)` in several pages/handlers. Reduces type safety.
- **Oversized files:** `training/page.tsx` (~41 KB wizard), `settings-client.tsx` (~815 lines), `enrollments/[courseId]/page.tsx` (~1636 lines), `NextJSBeneficiaryDirectory.tsx` (~78 KB / 1608 lines).
- **Mixed error-response shapes** across admin API routes: some return `{ error }`, some `{ message }`, some `{ success }`, some `404` with text; clients therefore use inconsistent handling (`data.error` vs `err?.error` vs `data.message`). Consider standardizing on `{ error: string }`.
- **Inconsistent rate limiting / step-up** across routes that do the same kind of action (e.g. CSV enrollments export is `requireAdmin`, PDF export is `requireStepUp`).

---

## 4. Positive Findings (good patterns to preserve)

- Authorization is **consistent and correct on the server**: every write handler I reviewed calls `requireAdmin()` and — where the action is in `SENSITIVE_ADMIN_ACTIONS` — `requireStepUp()`. I found **no unauthenticated/no-auth write handler**. Notably `leaders/[id]/delete` and `restore` and `member`/`teacher` delete, restore, status, `sessions` revoke, `certificates` approve/reject/generate, `notifications` POST, and multiple `website-content` sub-routes all correctly use `requireStepUp`.
- Step-up client gating is used correctly in `coupons-client`, `notifications-client`, `newsletters-client`, `enrollments/[courseId]`, `training/[courseId]`, `settings-client`, `members` client, and others.
- `certificates/page.tsx` demonstrates the correct data-loading pattern (wrapped `loadData` + retry + error UI) that other pages should copy.
- `site-setting-keys.ts` allowlist (`key -> category`) matches the settings `content` tab, so there is no category-mismatch save bug there.
- `isSafeRedirect` helper in `lib/redirect.ts` exists and is used by the login flow.

---

## 5. Suggested Fixes (nothing was modified — this is read-only)

1. **1.1**: wrap `returnTo` with `isSafeRedirect(returnTo, '/admin')` in `step-up-form.tsx:42`.
2. **1.2**: fix the `loadData` reference in `enrollments/page.tsx:113`.
3. **1.3**: replace `.catch(() => {})` with `Promise.allSettled` + failure toast in `NextJSBeneficiaryDirectory.tsx:588-595`.
4. **1.4**: derive the "recent" cutoff from `Date.now() - N days` once (single constant), and de-hardcode geo defaults.
5. **1.5**: never pass `process.env.SMTP_PASS` to the client; return a boolean and only accept a new password.
6. **1.6**: add `.catch`/error UI and consistent `requireStepUpClient` gating across website-content tabs.
7. **2**: add `checkRateLimit` to sensitive write routes (broadcast notification, coupons, site-settings, uploads).
