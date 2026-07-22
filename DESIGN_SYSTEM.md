# CompassionGlobal — Design System

A blue-and-white design system enforced across all User Dashboard and Admin Dashboard pages.

---

## Design Tokens

All tokens are defined in `app/globals.css` as CSS custom properties and exposed to Tailwind via the `@theme` block.

### Base Colors

| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `--background` | `#F8FAFC` | `bg-background` | Page background |
| `--card` | `#FFFFFF` | `bg-card` | Card/panel surface |
| `--foreground` | `#0F172A` | `text-foreground` | Primary text |
| `--muted-foreground` | `#64748B` | `text-muted-foreground` | Secondary/meta text |
| `--border` | `#E2E8F0` | `border-border` | Default borders |

### Primary Blue (the ONLY accent)

| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `--primary` | `#2563EB` | `bg-primary` / `text-primary` | CTAs, active states, links |
| `--primary-hover` | `#1D4ED8` | `bg-primary-hover` | Button hover |
| `--primary-light` | `#EFF6FF` | `bg-primary-light` | Tinted backgrounds, pill fills |
| `--secondary-blue` | `#93C5FD` | `bg-secondary-blue` | Secondary accent, tag tints |

### Sidebar (the one non-blue-white exception)

| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `--sidebar` | `#0F1B33` | `bg-sidebar` | Sidebar background |
| `--sidebar-foreground` | `#F8FAFC` | `text-sidebar-foreground` | Sidebar text |
| `--sidebar-active` | `#1E56A0` | `bg-sidebar-active` | Active sidebar item |

### Status Colors (ONLY on badges/pills/status indicators)

| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `--success` | `#16A34A` | `bg-success` | Success dot/icon |
| `--success-bg` | `#F0FDF4` | `bg-success-bg` | Success badge fill |
| `--success-text` | `#15803D` | `text-success-text` | Success badge text |
| `--warning` | `#F59E0B` | `bg-warning` | Warning dot/icon |
| `--warning-bg` | `#FFFBEB` | `bg-warning-bg` | Warning badge fill |
| `--warning-text` | `#B45309` | `text-warning-text` | Warning badge text |
| `--destructive` | `#DC2626` | `bg-destructive` | Delete/error actions |
| `--destructive-bg` | `#FEF2F2` | `bg-destructive-bg` | Error badge fill |
| `--destructive-text` | `#B91C1C` | `text-destructive-text` | Error badge text |
| `--destructive-foreground` | `#FFFFFF` | `text-destructive-foreground` | White text on destructive bg |

---

## Shared Components (`components/ui/`)

All shared primitives are in `components/ui/`. Import them directly — do not create new inline component definitions.

| Component | File | Purpose |
|---|---|---|
| `Button` | `button.tsx` | `primary` / `secondary` / `ghost` / `destructive` variants |
| `Card` | `card.tsx` | `Card`, `CardHeader`, `CardContent` |
| `Badge` | `badge.tsx` | `primary` / `success` / `warning` / `destructive` variants |
| `Input`, `Select` | `input.tsx` | Labeled form controls |
| `StatCard` | `stat-card.tsx` | Dashboard stat tiles (5 tint variants) |
| `EmptyState` | `empty-state.tsx` | "No data" placeholder |
| `Table` | `table.tsx` | `Table`, `TableHeader`, `TableRow`, etc. |
| `Modal` | `modal.tsx` | Overlay dialog |
| `Pagination` | `pagination.tsx` | Page navigation |

### Usage Example

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>
    <Badge variant="success">Active</Badge>
    <Button variant="primary">Save</Button>
  </CardContent>
</Card>
```

---

## Hard Rules

1. **Primary color is blue and ONLY blue.** Never use purple, indigo, cyan, teal, orange, or any other hue for interactive elements, links, buttons, icons, or decorative accents.

2. **Status colors ONLY on badges/pills/status indicators.** Use `success-*`, `warning-*`, `destructive-*` tokens only for badge fills, status text, form validation errors, and confirmation dialogs. Never use them for general UI chrome.

3. **Charts are blue-only.** Bar charts use `#2563EB` / `#1E56A0`. Line/area charts use `#2563EB`. No green, orange, or multi-colored chart elements.

4. **Sidebar is the one exception.** The sidebar intentionally uses `#0F1B33` (dark navy) as the only non-blue-white surface in the entire system.

5. **Star ratings stay amber.** `text-amber-500` is the universal UX convention for star ratings and is kept as-is.

6. **No hardcoded hex in JSX.** All color values must reference design tokens or Tailwind classes. The only exception is SVG chart attributes where Tailwind classes cannot be applied.

---

## Color Audit — Acceptable vs. Violations

### Acceptable (no fix needed)

- **`gray-*` Tailwind classes** — Neutral grays for form labels, borders, backgrounds. These are functionally equivalent to `slate-*` and are not accent/status colors.
- **SVG chart hex** — `#2563EB`, `#1E56A0`, `#0F1B33`, `#F1F5F9`, `#E2E8F0`, `#64748B` in `<line>`, `<rect>`, `<circle>`, `<path>`, `<text>` elements. Tailwind classes cannot be applied to SVG attributes.
- **`text-amber-500`** on star rating icons — Universal UX convention.
- **`placeholder="#2563EB"`** in settings — Displays the hex value to the user as instructional text.

### Former violations (all fixed)

- `text-purple-*` / `bg-purple-*` — Replaced with `text-primary` / `bg-primary-light`
- `text-indigo-*` / `bg-indigo-*` — Replaced with `text-primary` / `bg-primary-light`
- `text-cyan-*` / `bg-cyan-*` — Replaced with `text-primary` / `bg-secondary-blue`
- `text-orange-*` / `bg-orange-*` — Replaced with `text-primary` / `bg-primary-light`
- `text-emerald-*` / `bg-emerald-*` — Replaced with `text-success-text` / `bg-success-bg`
- `text-amber-*` / `bg-amber-*` (non-star) — Replaced with `text-warning-text` / `bg-warning-bg`
- `text-red-*` / `bg-red-*` — Replaced with `text-destructive` / `bg-destructive-bg`
- `text-green-*` / `bg-green-*` — Replaced with `text-success-text` / `bg-success-bg`
- `#DC2626` / `#F59E0B` / other hardcoded hex — Replaced with token classes

---

## File Inventory

### Shared Infrastructure
- `app/globals.css` — Design tokens (source of truth)
- `components/ui/*` — 9 shared primitive components
- `components/dashboard-ui.tsx` — Skeleton/loading components (tokenized)

### User Dashboard (tokenized)
- `app/dashboard/layout.tsx` — Sidebar + header
- `app/dashboard/page.tsx` — Home/overview
- `app/dashboard/profile/page.tsx` — Profile + password
- `app/dashboard/training/page.tsx` — Training browse
- `app/dashboard/training/[courseId]/page.tsx` — Course detail
- `app/dashboard/training/apply/[courseId]/page.tsx` — Course application
- `app/dashboard/applications/page.tsx` — Applications list
- `app/dashboard/certificates/page.tsx` — Certificates
- `app/dashboard/notifications/page.tsx` — Notifications
- `app/dashboard/activity/page.tsx` — Activity log

### Admin Dashboard (tokenized)
- `app/admin/layout.tsx` — Sidebar + header + command palette
- `app/admin/login/page.tsx` — Login page
- `app/admin/page.tsx` — Dashboard overview + SVG charts
- `app/admin/members/page.tsx` — Members CRUD
- `app/admin/teachers/page.tsx` — Teachers CRUD
- `app/admin/training/page.tsx` — Training + creation wizard
- `app/admin/enrollments/page.tsx` — Enrollments
- `app/admin/certificates/page.tsx` — Certificates
- `app/admin/coupons/page.tsx` — Coupons
- `app/admin/notifications/page.tsx` — Notifications
- `app/admin/activity-logs/page.tsx` — Activity logs
- `app/admin/website-content/page.tsx` — Website CMS
- `app/admin/settings/page.tsx` — Settings (8 form sections)

### Not changed (no public website)
- `app/page.tsx` — Redirects to `/dashboard` (no UI to style)

---

## Future Improvements (not blocking)

1. **`gray-*` → `slate-*` migration** — ~100 neutral gray references across 8+ files could be converted to `slate-*` for consistency with sidebar tokens. Low visual impact, high churn.
2. **`components/ui/` adoption** — Several admin pages still use inline component definitions instead of importing from `components/ui/`. Could be migrated incrementally.
3. **`cn()` utility** — `lib/utils.ts` exports a `cn()` helper that is never imported anywhere. Could be used for conditional class merging.
