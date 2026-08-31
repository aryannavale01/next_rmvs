# Graph Report - next_rmvs  (2026-08-30)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1778 nodes · 4332 edges · 136 communities (89 shown, 47 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `988287d0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dashboard-context.tsx
- useToast
- withRetry
- auth-client.ts
- logActivity
- cn
- upload-config.ts
- dossier-export.tsx
- devDependencies
- prisma
- session.ts
- [courseId]/route.ts
- requireStepUpClient
- certificates/download/route.ts
- enrollment-export-core.tsx
- e2eAdminCredentials
- admin-types.ts
- compilerOptions
- generatePageMetadata
- (protected)/training/page.tsx
- supabase-storage.ts
- (protected)/page.tsx
- NextJSBeneficiaryDirectory.tsx
- site-settings/bulk/route.ts
- seed.ts
- settings-client.tsx
- about/page.tsx
- certificates/[courseId]/page.tsx
- enrollments/[courseId]/page.tsx
- seed-certificates.ts
- org-config.ts
- my-courses/route.ts
- admin-enrollment.ts
- teachers/[id]/route.ts
- email.ts
- [slug]/page.tsx
- admin-member.ts
- prisma.ts
- blog-posts/[id]/route.ts
- leaders/[id]/route.ts
- members/route.ts
- analytics/route.ts
- send/route.ts
- donations/route.ts
- donate/page.tsx
- locations/[id]/route.ts
- programs/[id]/route.ts
- programs/page.tsx
- gallery-items/[id]/route.ts
- milestones/[id]/route.ts
- newsletters/[id]/route.ts
- partners/[id]/route.ts
- testimonials/[id]/route.ts
- dashboard/route.ts
- api-error.ts
- cleanup-qa.mjs
- enrollments/page.tsx
- programs-tab.tsx
- check/route.ts
- impact/page.tsx
- dependencies
- backfill-photo-variants.ts
- duplicate-checker.ts
- create-cms-bucket.mjs
- certificates/route.ts
- enrollment-timeline.tsx
- app/layout.tsx
- e2e-journey-helper.ts
- (protected)/certificates/page.tsx
- coupons/route.ts
- (public)/layout.tsx
- [code]/page.tsx
- enrollment-notes.tsx
- admin-org-document.ts
- middleware.ts
- seed-no-docs.ts
- session-retry.test.ts
- check-loginattempt.js
- check-verification.js
- list-users.js
- rotate-admin-pw.ts
- update-test-passwords.ts
- privacy/page.tsx
- terms/page.tsx
- code-of-conduct/page.tsx
- eslint.config.mjs
- next.config.ts
- backfill-profiles.ts
- check-admin-state.ts
- check-cms-counts.ts
- check-profile.js
- disable-2fa-forcepw.ts
- phase2-dashboard-profile.spec.ts
- autoprefixer
- class-variance-authority
- docx
- @google/genai
- @hookform/resolvers
- jszip
- @marsidev/react-turnstile
- motion
- next
- next-env.d.ts
- browser-image-compression
- pdf-lib
- postcss
- prisma
- @prisma/client
- puppeteer-core
- qrcode
- react
- react-dom
- @react-pdf/renderer
- recharts
- resend
- sharp
- @supabase/ssr
- @supabase/supabase-js
- swr
- tailwind-merge
- zod
- postcss.config.mjs
- phase1-auth.spec.ts

## God Nodes (most connected - your core abstractions)
1. `withRetry()` - 260 edges
2. `isTransientPrismaError()` - 140 edges
3. `requireAdmin()` - 129 edges
4. `logActivity()` - 122 edges
5. `prisma` - 119 edges
6. `stepUpErrorResponse()` - 112 edges
7. `requireStepUp()` - 109 edges
8. `dbErrorResponse()` - 88 edges
9. `useToast()` - 69 edges
10. `checkRateLimit()` - 44 edges

## Surprising Connections (you probably didn't know these)
- `ToastItem()` --calls--> `cn()`  [EXTRACTED]
  components/ui/toast.tsx → lib/utils.ts
- `ContactPage()` --calls--> `withRetry()`  [EXTRACTED]
  app/(public)/contact/page.tsx → lib/prisma.ts
- `OfficesPage()` --calls--> `withRetry()`  [EXTRACTED]
  app/(public)/offices/page.tsx → lib/prisma.ts
- `MissionPage()` --calls--> `withRetry()`  [EXTRACTED]
  app/(public)/page.tsx → lib/prisma.ts
- `ResourcesPage()` --calls--> `withRetry()`  [EXTRACTED]
  app/(public)/resources/page.tsx → lib/prisma.ts

## Import Cycles
- None detected.

## Communities (136 total, 47 thin omitted)

### Community 0 - "dashboard-context.tsx"
Cohesion: 0.07
Nodes (56): ActivityPage(), ApplicationsPage(), CertificatesPage(), NotificationsPage(), DashboardHome(), ApplyCoursePage(), CourseDetailPage(), CATEGORY_COLOR (+48 more)

### Community 1 - "useToast"
Cohesion: 0.04
Nodes (59): ContactSocialTab(), SETTINGS_CONFIG, SiteSetting, EMPTY, Form, GalleryItem, GalleryTab(), EMPTY (+51 more)

### Community 2 - "withRetry"
Cohesion: 0.08
Nodes (55): AdminNewslettersPage(), AdminNotificationsPage(), AdminSettingsPage(), Setup2FAPage(), dynamic, GET(), GET(), GET() (+47 more)

### Community 3 - "auth-client.ts"
Cohesion: 0.05
Nodes (36): AdminLoginForm(), SetupStep, TOTPSetupForm(), dynamic, Verify2FAPage(), Verify2FAForm(), dynamic, VerifyStepUpPage() (+28 more)

### Community 4 - "logActivity"
Cohesion: 0.09
Nodes (45): dynamic, POST(), dynamic, POST(), DELETE(), mapCoupon(), PATCH(), DELETE() (+37 more)

### Community 5 - "cn"
Cohesion: 0.05
Nodes (33): Badge(), BadgeProps, BadgeVariant, variantClasses, Button, ButtonProps, sizeClasses, variantClasses (+25 more)

### Community 6 - "upload-config.ts"
Cohesion: 0.08
Nodes (36): DELETE(), dynamic, POST(), dynamic, GET(), dynamic, QuerySchema, DELETE() (+28 more)

### Community 7 - "dossier-export.tsx"
Cohesion: 0.07
Nodes (43): NextJSBeneficiaryDirectory(), C, COL_WIDTHS, colPercent(), dateStamp(), DetailSection(), docStatusStyle(), docStatusText() (+35 more)

### Community 8 - "devDependencies"
Cohesion: 0.04
Nodes (48): eslint, eslint-config-next, firebase-tools, devDependencies, eslint, eslint-config-next, firebase-tools, playwright (+40 more)

### Community 9 - "prisma"
Cohesion: 0.08
Nodes (33): dynamic, ELIGIBLE_STATUSES, POST(), POST(), POST(), AUTH_RATE_LIMITS, authRateLimit(), dynamic (+25 more)

### Community 10 - "session.ts"
Cohesion: 0.10
Nodes (32): dynamic, GET(), runtime, dynamic, GET(), VALID_STATUSES, dynamic, GET() (+24 more)

### Community 11 - "[courseId]/route.ts"
Cohesion: 0.09
Nodes (37): couponCodes(), dynamic, GET(), PATCH(), replaceSyllabus(), syncCoupons(), VALID_CATEGORIES, VALID_MODES (+29 more)

### Community 12 - "requireStepUpClient"
Cohesion: 0.12
Nodes (27): AdminCouponsPage(), CATEGORIES, CourseSettingsData, CourseSettingsForm(), DOC_OPTIONS, STATUSES, TrainingWorkspacePage(), Newsletter (+19 more)

### Community 13 - "certificates/download/route.ts"
Cohesion: 0.11
Nodes (31): dynamic, POST(), runtime, dynamic, POST(), assetsDir(), CANDIDATE_CHROME_PATHS, escapeHtml() (+23 more)

### Community 14 - "enrollment-export-core.tsx"
Cohesion: 0.11
Nodes (31): DOC_TYPE_TO_BUCKET, dynamic, runtime, buildDoc(), buildPdfBlob(), CourseData, CourseDetailsSection(), formatDate() (+23 more)

### Community 15 - "e2eAdminCredentials"
Cohesion: 0.09
Nodes (14): loginAsAdmin(), loginAsAdmin(), NOTE: do not match "/admin/**" — the login page itself is /admin/login., findChwCourseId(), loginAsAdmin(), openCourseWorkspace(), ADMIN, e2eAdminCredentials() (+6 more)

### Community 16 - "admin-types.ts"
Cohesion: 0.09
Nodes (29): PAGE_SIZES, SortDir, SortKey, STATUSES, TEACHER_TYPES, TYPE_LABELS, AdminContext, AdminContextType (+21 more)

### Community 17 - "compilerOptions"
Cohesion: 0.07
Nodes (29): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, public_site, react_web (+21 more)

### Community 18 - "generatePageMetadata"
Cohesion: 0.11
Nodes (21): generateMetadata(), ContactPage(), dynamic, generateMetadata(), dynamic, generateMetadata(), OfficesPage(), MissionPageClient() (+13 more)

### Community 19 - "(protected)/training/page.tsx"
Cohesion: 0.09
Nodes (19): DraftState, ICON_OPTIONS, iconByName(), Notif, NotificationsClient(), readDraft(), TARGETS, dynamic (+11 more)

### Community 20 - "supabase-storage.ts"
Cohesion: 0.12
Nodes (21): DOC_TYPE_TO_BUCKET, dynamic, GET(), DOC_TYPE_TO_BUCKET, dynamic, formatProfileResponse(), GET(), PROFILE_SELECT (+13 more)

### Community 21 - "(protected)/page.tsx"
Cohesion: 0.10
Nodes (21): ActivityLogsClient(), getIcon(), iconMap, Log, PAGE_SIZES, AdminActivityLogsPage(), dynamic, ActivityLog (+13 more)

### Community 22 - "NextJSBeneficiaryDirectory.tsx"
Cohesion: 0.12
Nodes (18): AdminError(), AdminShell(), CommandPalette(), NAV_ITEMS, PAGE_TITLES, Course, DOC_STATUS_STYLES, Enrollment (+10 more)

### Community 23 - "site-settings/bulk/route.ts"
Cohesion: 0.12
Nodes (20): bulkSchema, dynamic, POST(), settingEntrySchema, DELETE(), dynamic, GET(), PATCH() (+12 more)

### Community 24 - "seed.ts"
Cohesion: 0.20
Nodes (23): APPLICATION_STATUSES, COURSES, dateStr(), daysAgo(), enrichProfile(), ensureUser(), getScaleConfig(), main() (+15 more)

### Community 25 - "settings-client.tsx"
Cohesion: 0.11
Nodes (10): DEFAULT_SETTINGS, dynamic, SettingRow, LANGUAGES, SettingRow, SettingsClient(), SettingsClientProps, TAB_LIST (+2 more)

### Community 26 - "about/page.tsx"
Cohesion: 0.15
Nodes (16): AboutClient(), ComplianceDoc, LeaderData, LocationData, MilestoneData, AboutPage(), dynamic, TYPE_LABELS (+8 more)

### Community 27 - "certificates/[courseId]/page.tsx"
Cohesion: 0.13
Nodes (16): CertificateRow, CertificateWorkspacePage(), CourseInfo, DetailData, ELIGIBLE_STATUSES, ENROLLMENT_BADGE_STYLES, enrollmentBadge(), EnrollmentRow (+8 more)

### Community 28 - "enrollments/[courseId]/page.tsx"
Cohesion: 0.12
Nodes (15): AnalyticsData, ApplicationRow, CourseInfo, ENROLLMENT_COLORS, Pagination, STATUS_BAR_COLORS, Tab, TABS (+7 more)

### Community 29 - "seed-certificates.ts"
Cohesion: 0.20
Nodes (17): CertSeed, courseBySlug(), daysAgo(), ensureUser(), generateVerificationCode(), hasCertificate(), hasCertificateRequest(), main() (+9 more)

### Community 30 - "org-config.ts"
Cohesion: 0.16
Nodes (13): AdminProtectedLayout(), dynamic, DashboardLayout(), dynamic, dynamic, GET(), AdminLayout(), DEFAULTS (+5 more)

### Community 31 - "my-courses/route.ts"
Cohesion: 0.15
Nodes (14): dynamic, LESSON_TYPE_MAP, LEVEL_DISPLAY, MODE_DISPLAY, computeProgress(), differenceInDays(), dynamic, GET() (+6 more)

### Community 32 - "admin-enrollment.ts"
Cohesion: 0.12
Nodes (16): AdminNoteCreate, AdminNoteCreateSchema, ApplicationStatusSchema, BulkAction, BulkActionSchema, EnrollmentExport, EnrollmentExportSchema, EnrollmentFilters (+8 more)

### Community 33 - "teachers/[id]/route.ts"
Cohesion: 0.16
Nodes (13): dynamic, GET(), mapTeacher(), dynamic, mapTeacher(), POST(), QuerySchema, CreateTeacherInput (+5 more)

### Community 34 - "email.ts"
Cohesion: 0.19
Nodes (13): ContactSchema, dynamic, POST(), verifyTurnstile(), dynamic, POST(), SubscribeSchema, BatchEmail (+5 more)

### Community 35 - "[slug]/page.tsx"
Cohesion: 0.13
Nodes (14): dynamic, EnrollmentStatus, generateMetadata(), LEVEL_DISPLAY, MODE_DISPLAY, ProgramDetailPage(), APPLICATION_STATUS_LABELS, CourseDetail (+6 more)

### Community 36 - "admin-member.ts"
Cohesion: 0.12
Nodes (15): beneficiaryAddressSchema, beneficiaryDetailSchema, CreateMemberInput, educationQualificationEnum, genderEnum, maritalStatusEnum, occupationEnum, profileStatusEnum (+7 more)

### Community 37 - "prisma.ts"
Cohesion: 0.14
Nodes (9): dynamic, dynamic, dynamic, dynamic, GET(), mapProfileDetail(), dynamic, globalForPrisma (+1 more)

### Community 38 - "blog-posts/[id]/route.ts"
Cohesion: 0.15
Nodes (12): DELETE(), dynamic, GET(), PATCH(), dynamic, GET(), POST(), QuerySchema (+4 more)

### Community 39 - "leaders/[id]/route.ts"
Cohesion: 0.15
Nodes (12): DELETE(), dynamic, GET(), PATCH(), dynamic, GET(), POST(), QuerySchema (+4 more)

### Community 40 - "members/route.ts"
Cohesion: 0.18
Nodes (12): BulkImportSchema, dynamic, generateTempPassword(), RowResult, ageToDate(), dynamic, GET(), mapProfile() (+4 more)

### Community 41 - "analytics/route.ts"
Cohesion: 0.23
Nodes (10): dynamic, GET(), computeHealthIndicator(), DEFAULT_THRESHOLDS, HealthFactor, HealthIndicator, HealthThresholds, getSeatAvailability() (+2 more)

### Community 42 - "send/route.ts"
Cohesion: 0.26
Nodes (10): dynamic, POST(), dynamic, GET(), schema, buildNewsletterBroadcastHtml(), sendBatchEmails(), buildUnsubscribeToken() (+2 more)

### Community 43 - "donations/route.ts"
Cohesion: 0.21
Nodes (10): dynamic, POST(), schema, DonationSchema, dynamic, generateReceiptId(), POST(), dynamic (+2 more)

### Community 44 - "donate/page.tsx"
Cohesion: 0.18
Nodes (10): CreateOrderResponse, DonateClient(), RazorpayInstance, RazorpayOptions, RazorpayResponse, TIERS, Window, DonatePage() (+2 more)

### Community 45 - "locations/[id]/route.ts"
Cohesion: 0.20
Nodes (9): DELETE(), dynamic, GET(), PATCH(), CreateLocationInput, createLocationSchema, locationTypeEnum, UpdateLocationInput (+1 more)

### Community 46 - "programs/[id]/route.ts"
Cohesion: 0.20
Nodes (9): DELETE(), dynamic, GET(), PATCH(), CreateProgramInput, createProgramSchema, UpdateProgramInput, updateProgramSchema (+1 more)

### Community 47 - "programs/page.tsx"
Cohesion: 0.25
Nodes (9): generateMetadata(), LEVEL_DISPLAY, mapCourseForPublic(), PROGRAM_CATEGORY_DISPLAY, ProgramsPage(), ProgramsClient(), ProgramsClientProps, PublicCourse (+1 more)

### Community 48 - "gallery-items/[id]/route.ts"
Cohesion: 0.22
Nodes (8): DELETE(), dynamic, GET(), PATCH(), CreateGalleryItemInput, createGalleryItemSchema, UpdateGalleryItemInput, updateGalleryItemSchema

### Community 49 - "milestones/[id]/route.ts"
Cohesion: 0.22
Nodes (8): DELETE(), dynamic, GET(), PATCH(), CreateMilestoneInput, createMilestoneSchema, UpdateMilestoneInput, updateMilestoneSchema

### Community 50 - "newsletters/[id]/route.ts"
Cohesion: 0.22
Nodes (8): DELETE(), dynamic, GET(), PATCH(), CreateNewsletterInput, createNewsletterSchema, UpdateNewsletterInput, updateNewsletterSchema

### Community 51 - "partners/[id]/route.ts"
Cohesion: 0.22
Nodes (8): DELETE(), dynamic, GET(), PATCH(), CreatePartnerInput, createPartnerSchema, UpdatePartnerInput, updatePartnerSchema

### Community 52 - "testimonials/[id]/route.ts"
Cohesion: 0.22
Nodes (8): DELETE(), dynamic, GET(), PATCH(), CreateTestimonialInput, createTestimonialSchema, UpdateTestimonialInput, updateTestimonialSchema

### Community 53 - "dashboard/route.ts"
Cohesion: 0.27
Nodes (9): ACTIVITY_TYPE_MAP, APPLICATION_STATUS_MAP, CERTIFICATE_STATUS_MAP, dynamic, GET(), NOTIFICATION_TYPE_MAP, toActivityGroup(), toNotificationGroup() (+1 more)

### Community 54 - "api-error.ts"
Cohesion: 0.36
Nodes (9): apiError(), ApiErrorOptions, databaseError(), forbiddenError(), rateLimitError(), serverError(), stepUpRequiredError(), unauthorizedError() (+1 more)

### Community 55 - "cleanup-qa.mjs"
Cohesion: 0.22
Nodes (9): { createClient }, deleteByPrefix(), __dirname, dotenv, main(), prisma, { PrismaClient }, projectRoot (+1 more)

### Community 56 - "enrollments/page.tsx"
Cohesion: 0.25
Nodes (5): CourseCard, OverviewData, CONFIG, HealthBadge(), HealthBadgeProps

### Community 57 - "programs-tab.tsx"
Cohesion: 0.28
Nodes (7): EMPTY, Form, Program, ProgramsTab(), VIS, visBadge(), visLabel()

### Community 58 - "check/route.ts"
Cohesion: 0.28
Nodes (7): dynamic, GET(), getStepUpWindowMs(), SENSITIVE_ADMIN_ACTIONS, SensitiveAdminAction, STEP_UP_WINDOW_MS, STEP_UP_WINDOW_MS_DEFAULT

### Community 59 - "impact/page.tsx"
Cohesion: 0.25
Nodes (7): GalleryItemData, ImpactClient(), ImpactClientProps, PartnerData, dynamic, generateMetadata(), ImpactPage()

### Community 60 - "dependencies"
Cohesion: 0.22
Nodes (9): better-auth, clsx, lucide-react, dependencies, better-auth, clsx, lucide-react, razorpay (+1 more)

### Community 61 - "backfill-photo-variants.ts"
Cohesion: 0.31
Nodes (8): backfillProfile(), BackfillResult, downloadFile(), main(), prisma, NOTE: If the existing avatarUrl is a low-res image (e.g., 256x256 from old…, supabase, uploadFile()

### Community 62 - "duplicate-checker.ts"
Cohesion: 0.39
Nodes (7): checkAadhaarCourseDuplicate(), checkDuplicate(), checkEmailCourseDuplicate(), checkProfileCourseDuplicate(), DuplicateCheckResult, DuplicateCheckStrategy, getChecksForStrategy()

### Community 63 - "create-cms-bucket.mjs"
Cohesion: 0.25
Nodes (6): { createClient }, __dirname, dotenv, projectRoot, require, supabase

### Community 64 - "certificates/route.ts"
Cohesion: 0.38
Nodes (6): COMPLETED_STATUSES, dynamic, ELIGIBLE_ENROLLMENT_STATUSES, GET(), summarizeCertificates(), summarizeEnrollments()

### Community 65 - "enrollment-timeline.tsx"
Cohesion: 0.33
Nodes (6): buildSteps(), EnrollmentTimeline(), EnrollmentTimelineProps, STATUS_COLORS, STATUS_ICONS, TimelineStep

### Community 66 - "app/layout.tsx"
Cohesion: 0.33
Nodes (4): generateMetadata(), inter, jetbrainsMono, spaceGrotesk

### Community 67 - "e2e-journey-helper.ts"
Cohesion: 0.47
Nodes (5): cleanup(), [command, arg], findUserId(), prisma, verifyEmail()

### Community 69 - "coupons/route.ts"
Cohesion: 0.60
Nodes (4): dynamic, GET(), mapCoupon(), POST()

### Community 70 - "(public)/layout.tsx"
Cohesion: 0.50
Nodes (4): darkenHex(), dynamic, PublicLayout(), PublicLayoutWrapper()

### Community 71 - "[code]/page.tsx"
Cohesion: 0.50
Nodes (4): dynamic, formatDate(), revalidate, VerifyPage()

### Community 72 - "enrollment-notes.tsx"
Cohesion: 0.50
Nodes (4): EnrollmentNotes(), EnrollmentNotesProps, formatDate(), Note

### Community 73 - "admin-org-document.ts"
Cohesion: 0.40
Nodes (4): createOrgDocumentSchema, ORG_DOCUMENT_TYPES, OrgDocumentTypeValue, updateOrgDocumentSchema

### Community 74 - "middleware.ts"
Cohesion: 0.60
Nodes (4): config, isSafeRedirect(), middleware(), pathnameStartsWith()

### Community 75 - "seed-no-docs.ts"
Cohesion: 0.60
Nodes (4): daysAgo(), main(), prisma, uuid()

### Community 80 - "rotate-admin-pw.ts"
Cohesion: 0.67
Nodes (3): generatePassword(), main(), prisma

## Knowledge Gaps
- **657 isolated node(s):** `FilterTab`, `EmptyStateProps`, `Language`, `DocumentStatus`, `SiteSetting` (+652 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **47 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withRetry()` connect `withRetry` to `logActivity`, `upload-config.ts`, `prisma`, `session.ts`, `[courseId]/route.ts`, `requireStepUpClient`, `certificates/download/route.ts`, `enrollment-export-core.tsx`, `generatePageMetadata`, `(protected)/training/page.tsx`, `supabase-storage.ts`, `(protected)/page.tsx`, `site-settings/bulk/route.ts`, `settings-client.tsx`, `about/page.tsx`, `org-config.ts`, `my-courses/route.ts`, `teachers/[id]/route.ts`, `email.ts`, `[slug]/page.tsx`, `prisma.ts`, `blog-posts/[id]/route.ts`, `leaders/[id]/route.ts`, `members/route.ts`, `analytics/route.ts`, `send/route.ts`, `donations/route.ts`, `donate/page.tsx`, `locations/[id]/route.ts`, `programs/[id]/route.ts`, `gallery-items/[id]/route.ts`, `milestones/[id]/route.ts`, `newsletters/[id]/route.ts`, `partners/[id]/route.ts`, `testimonials/[id]/route.ts`, `dashboard/route.ts`, `check/route.ts`, `impact/page.tsx`, `certificates/route.ts`, `coupons/route.ts`, `[code]/page.tsx`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `prisma` connect `prisma` to `withRetry`, `logActivity`, `upload-config.ts`, `session.ts`, `[courseId]/route.ts`, `requireStepUpClient`, `certificates/download/route.ts`, `enrollment-export-core.tsx`, `generatePageMetadata`, `(protected)/training/page.tsx`, `supabase-storage.ts`, `(protected)/page.tsx`, `site-settings/bulk/route.ts`, `settings-client.tsx`, `about/page.tsx`, `org-config.ts`, `my-courses/route.ts`, `teachers/[id]/route.ts`, `email.ts`, `[slug]/page.tsx`, `prisma.ts`, `blog-posts/[id]/route.ts`, `leaders/[id]/route.ts`, `members/route.ts`, `analytics/route.ts`, `send/route.ts`, `donations/route.ts`, `donate/page.tsx`, `locations/[id]/route.ts`, `programs/[id]/route.ts`, `programs/page.tsx`, `gallery-items/[id]/route.ts`, `milestones/[id]/route.ts`, `newsletters/[id]/route.ts`, `partners/[id]/route.ts`, `testimonials/[id]/route.ts`, `dashboard/route.ts`, `check/route.ts`, `impact/page.tsx`, `duplicate-checker.ts`, `certificates/route.ts`, `coupons/route.ts`, `[code]/page.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `useToast()` connect `useToast` to `dashboard-context.tsx`, `auth-client.ts`, `dossier-export.tsx`, `impact/page.tsx`, `requireStepUpClient`, `donate/page.tsx`, `programs/page.tsx`, `admin-types.ts`, `generatePageMetadata`, `(protected)/training/page.tsx`, `NextJSBeneficiaryDirectory.tsx`, `settings-client.tsx`, `about/page.tsx`, `certificates/[courseId]/page.tsx`, `enrollments/[courseId]/page.tsx`, `programs-tab.tsx`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **What connects `FilterTab`, `EmptyStateProps`, `Language` to the rest of the system?**
  _657 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dashboard-context.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06971975393028025 - nodes in this community are weakly interconnected._
- **Should `useToast` be split into smaller, more focused modules?**
  _Cohesion score 0.043963963963963966 - nodes in this community are weakly interconnected._
- **Should `withRetry` be split into smaller, more focused modules?**
  _Cohesion score 0.07552447552447553 - nodes in this community are weakly interconnected._