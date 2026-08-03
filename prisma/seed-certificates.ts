import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@better-auth/utils/password";
import * as crypto from "node:crypto";

const DIRECT_URL = process.env.DIRECT_URL!;
if (!DIRECT_URL) throw new Error("DIRECT_URL is required");

const prisma = new PrismaClient({
  datasources: { db: { url: DIRECT_URL } },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uuid(): string {
  return crypto.randomUUID();
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function ensureUser(
  email: string,
  name: string,
  password: string,
  role: "admin" | "member",
): Promise<string | null> {
  const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
    'SELECT id FROM "User" WHERE email = $1',
    email,
  );
  if (existing.length > 0) {
    console.log(`  SKIP (exists): ${email}`);
    return existing[0].id;
  }

  const id = crypto.randomBytes(16).toString("hex");
  const now = new Date();

  await prisma.$executeRawUnsafe(
    'INSERT INTO "User" (id, email, "emailVerified", name, role, "mustChangePassword", "lastLoginAt", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5::"Role", $6, $7, $8, $9)',
    id,
    email,
    true,
    name,
    role === "admin" ? "ADMIN" : "MEMBER",
    role === "admin",
    now,
    now,
    now,
  );

  const hashedPw = await hashPassword(password);
  const accountId = crypto.randomBytes(12).toString("hex");

  await prisma.$executeRawUnsafe(
    'INSERT INTO "Account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
    crypto.randomBytes(16).toString("hex"),
    id,
    accountId,
    "credential",
    hashedPw,
    now,
    now,
  );

  try {
    await prisma.$executeRawUnsafe(
      'INSERT INTO profiles (id, full_name, email, role, district, state, updated_at) VALUES ($1, $2, $3, $4::user_role, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
      id,
      name,
      email,
      role,
      "Pune",
      "Maharashtra",
      now,
    );
  } catch {
    // Trigger already handled it
  }

  console.log(`  CREATED: ${email} (${role})`);
  return id;
}

async function courseBySlug(slug: string): Promise<{ id: string; title: string; instructorName: string } | null> {
  const rows = await prisma.$queryRawUnsafe<{ id: string; title: string; instructor_name: string }[]>(
    "SELECT id, title, instructor_name FROM courses WHERE slug = $1",
    slug,
  );
  return rows.length > 0
    ? { id: rows[0].id, title: rows[0].title, instructorName: rows[0].instructor_name }
    : null;
}

async function hasEnrollment(profileId: string, courseId: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    "SELECT id FROM course_enrollments WHERE profile_id = $1 AND course_id = $2",
    profileId,
    courseId,
  );
  return rows.length > 0;
}

async function hasCertificate(profileId: string, courseId: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    "SELECT id FROM certificates WHERE profile_id = $1 AND course_id = $2",
    profileId,
    courseId,
  );
  return rows.length > 0;
}

async function hasCertificateRequest(profileId: string, courseId: string | null): Promise<boolean> {
  const params: unknown[] = [profileId];
  const courseClause = courseId ? "course_id = $2" : "course_id IS NULL";
  if (courseId) params.push(courseId);
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM certificate_requests WHERE profile_id = $1 AND ${courseClause}`,
    ...params,
  );
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

const HEALTH_SLUG = "community-health-worker-training";
const DIGITAL_SLUG = "digital-literacy-for-women";

interface CertSeed {
  number: string;
  status: string;
  published: string;
}

interface MemberScenario {
  key: string;
  email: string;
  name: string;
  slug: string;
  enrollmentStatus: string;
  cert: CertSeed | null;
}

const MEMBER_SCENARIOS: MemberScenario[] = [
  { key: "eligible1", email: "cert.eligible1@example.com", name: "Sakshi Pawar", slug: HEALTH_SLUG, enrollmentStatus: "completed", cert: null },
  { key: "eligible2", email: "cert.eligible2@example.com", name: "Meena Joshi", slug: DIGITAL_SLUG, enrollmentStatus: "completed", cert: null },
  { key: "pending", email: "cert.pending@example.com", name: "Kavita More", slug: HEALTH_SLUG, enrollmentStatus: "completed", cert: { number: "MH-SKILL-2025-10001", status: "pending", published: "pending" } },
  { key: "approved", email: "cert.approved@example.com", name: "Sunita Kale", slug: HEALTH_SLUG, enrollmentStatus: "completed", cert: { number: "MH-SKILL-2025-10002", status: "approved", published: "pending" } },
  { key: "published", email: "cert.published@example.com", name: "Anita Ghadge", slug: HEALTH_SLUG, enrollmentStatus: "certified", cert: { number: "MH-SKILL-2025-10003", status: "generated", published: "published" } },
  { key: "revoked", email: "cert.revoked@example.com", name: "Pooja Deshmukh", slug: HEALTH_SLUG, enrollmentStatus: "completed", cert: { number: "MH-SKILL-2025-10004", status: "revoked", published: "unpublished" } },
  { key: "enrolled", email: "cert.enrolled@example.com", name: "Rekha Wagh", slug: HEALTH_SLUG, enrollmentStatus: "enrolled", cert: null },
  { key: "inprogress", email: "cert.inprogress@example.com", name: "Vandana Bhoite", slug: HEALTH_SLUG, enrollmentStatus: "in_progress", cert: null },
  { key: "dropped", email: "cert.dropped@example.com", name: "Asha Shinde", slug: HEALTH_SLUG, enrollmentStatus: "dropped", cert: null },
];

const REQUEST_SCENARIOS = [
  { key: "req-pending", email: "cert.req1@example.com", name: "Sarika Jadhav", slug: HEALTH_SLUG, status: "pending", notes: "Completed training batch, requesting certificate" },
  { key: "req-pending-global", email: "cert.req2@example.com", name: "Deepa Patil", slug: null, status: "pending", notes: "Requesting certificate outside course flow" },
  { key: "req-approved", email: "cert.req3@example.com", name: "Mangala Ahire", slug: HEALTH_SLUG, status: "approved", notes: "Approved after document verification" },
  { key: "req-rejected", email: "cert.req4@example.com", name: "Usha Tambe", slug: HEALTH_SLUG, status: "rejected", notes: "Incomplete training attendance" },
];

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

async function seedEnrollment(scenario: MemberScenario, profileId: string, course: { id: string; title: string; instructorName: string }) {
  if (await hasEnrollment(profileId, course.id)) {
    console.log(`  SKIP (enrollment exists): ${scenario.key}`);
    return;
  }

  const completed = ["completed", "certified"].includes(scenario.enrollmentStatus);
  const certified = scenario.enrollmentStatus === "certified";
  const hasCert = scenario.cert !== null && scenario.cert.status !== "revoked";

  await prisma.$executeRawUnsafe(
    `INSERT INTO course_enrollments (
      id, profile_id, course_id, batch_label, trainer, enrollment_date, completion_date,
      status, attendance, assessment_score, certificate_generated, documents_verified,
      seat_number, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::enrollment_status, $9, $10, $11, $12, $13, NOW(), NOW())
    ON CONFLICT (profile_id, course_id) DO NOTHING`,
    uuid(),
    profileId,
    course.id,
    "Batch 2026-01",
    completed ? course.instructorName : null,
    daysAgo(45),
    completed ? daysAgo(5) : null,
    scenario.enrollmentStatus,
    completed ? 88 : 42,
    completed ? 86 : null,
    hasCert || certified,
    true,
    11,
  );
  console.log(`  CREATED enrollment: ${scenario.key} (${scenario.enrollmentStatus})`);
}

async function seedCertificate(scenario: MemberScenario, profileId: string, course: { id: string; title: string; instructorName: string }) {
  const cert = scenario.cert;
  if (!cert) return;
  if (await hasCertificate(profileId, course.id)) {
    console.log(`  SKIP (certificate exists): ${scenario.key}`);
    return;
  }

  await prisma.$executeRawUnsafe(
    `INSERT INTO certificates (
      id, certificate_number, profile_id, course_id, batch, teacher_name,
      issue_date, completion_date, generation_date,
      status, published_status, template_name, language, verification_url,
      generated_by, remarks, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::certificate_status, $11::published_status, $12, $13, $14, $15, $16, NOW())
    ON CONFLICT (certificate_number) DO NOTHING`,
    uuid(),
    cert.number,
    profileId,
    course.id,
    "Batch 2026-01",
    course.instructorName,
    daysAgo(3),
    daysAgo(5),
    daysAgo(4),
    cert.status,
    cert.published,
    "default",
    "English",
    null,
    null,
    cert.status === "revoked" ? "Seeded revoked for testing re-eligibility" : null,
  );
  console.log(`  CREATED certificate: ${scenario.key} (${cert.status}/${cert.published})`);
}

async function seedCertificateRequest(
  key: string,
  profileId: string,
  course: { id: string; title: string } | null,
  status: string,
  notes: string | null,
) {
  if (await hasCertificateRequest(profileId, course?.id ?? null)) {
    console.log(`  SKIP (request exists): ${key}`);
    return;
  }

  const requestDate = daysAgo(status === "pending" ? 3 : 20);
  const sql = `INSERT INTO certificate_requests (id, profile_id, course_id, batch, request_date, status, notes, created_at)
               VALUES ($1, $2, $3, $4, $5, $6::request_status, $7, NOW())`;
  await prisma.$executeRawUnsafe(
    sql,
    uuid(),
    profileId,
    course?.id ?? null,
    course ? "Batch 2026-01" : null,
    requestDate,
    status,
    notes,
  );
  console.log(`  CREATED request: ${key} (${status})`);
}

async function seedSupportData(profileId: string, course: { id: string; title: string }, key: string) {
  if (key === "published") {
    const notifications = [
      { title: "Certificate Generated", description: `Your certificate for ${course.title} is ready for download.`, type: "success", read: false, daysAgo: 2 },
      { title: "Certificate Published", description: `Your certificate for ${course.title} has been published and can be verified online.`, type: "info", read: false, daysAgo: 1 },
    ];
    const existingNotif = await prisma.$queryRawUnsafe<{ id: string }[]>(
      "SELECT id FROM notifications WHERE profile_id = $1 AND title = $2",
      profileId,
      notifications[0].title,
    );
    if (existingNotif.length === 0) {
      for (const n of notifications) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO notifications (id, profile_id, icon, title, description, type, "read", timestamp, created_at)
           VALUES ($1, $2, 'Award', $3, $4, $5, $6, $7, NOW())`,
          uuid(),
          profileId,
          n.title,
          n.description,
          n.type,
          n.read,
          daysAgo(n.daysAgo),
        );
      }
      console.log(`  CREATED notifications: ${key}`);
    }

    const existingAct = await prisma.$queryRawUnsafe<{ id: string }[]>(
      "SELECT id FROM activities WHERE profile_id = $1 AND title = $2",
      profileId,
      "Completed Training",
    );
    if (existingAct.length === 0) {
      const activities = [
        { title: "Completed Training", description: `Successfully completed ${course.title}.`, category: "training", daysAgo: 6 },
        { title: "Certificate Generated", description: `Certificate issued for ${course.title}.`, category: "certificate", daysAgo: 2 },
      ];
      for (const a of activities) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO activities (id, profile_id, icon, title, description, timestamp, category, created_at)
           VALUES ($1, $2, 'Award', $3, $4, $5, $6, NOW())`,
          uuid(),
          profileId,
          a.title,
          a.description,
          daysAgo(a.daysAgo),
          a.category,
        );
      }
      console.log(`  CREATED activities: ${key}`);
    }
  }

  if (key === "eligible1" || key === "eligible2") {
    const existingApp = await prisma.$queryRawUnsafe<{ id: string }[]>(
      "SELECT id FROM course_applications WHERE profile_id = $1 AND course_id = $2",
      profileId,
      course.id,
    );
    if (existingApp.length === 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO course_applications (id, profile_id, course_id, applied_date, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'seat_reserved'::application_status, NOW(), NOW())
         ON CONFLICT (profile_id, course_id) DO NOTHING`,
        uuid(),
        profileId,
        course.id,
        daysAgo(50),
      );
      console.log(`  CREATED application: ${key}`);
    }
  }
}

async function main() {
  console.log("=== Seeding Certificate Test Data ===\n");
  console.log("--- Members & enrollments ---");
  const courses = new Map<string, { id: string; title: string; instructorName: string }>();

  for (const scenario of MEMBER_SCENARIOS) {
    const course = await courseBySlug(scenario.slug);
    if (!course) {
      console.log(`  SKIP: course ${scenario.slug} not found`);
      continue;
    }
    courses.set(scenario.slug, course);

    const profileId = await ensureUser(scenario.email, scenario.name, "Testuser@123", "member");
    if (!profileId) continue;

    await seedEnrollment(scenario, profileId, course);
    await seedCertificate(scenario, profileId, course);
  }

  console.log("\n--- Certificate requests ---");
  for (const req of REQUEST_SCENARIOS) {
    const course = req.slug ? await courseBySlug(req.slug) : null;
    if (req.slug && !course) {
      console.log(`  SKIP: course ${req.slug} not found`);
      continue;
    }
    const profileId = await ensureUser(req.email, req.name, "Testuser@123", "member");
    if (!profileId) continue;
    await seedCertificateRequest(req.key, profileId, course, req.status, req.notes);
  }

  console.log("\n--- Supporting data (applications / notifications / activities) ---");
  for (const scenario of MEMBER_SCENARIOS) {
    const course = courses.get(scenario.slug);
    if (!course) continue;
    const profileRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
      'SELECT id FROM profiles WHERE email = $1',
      scenario.email,
    );
    if (profileRows.length === 0) continue;
    await seedSupportData(profileRows[0].id, course, scenario.key);
  }

  console.log("\n=== Certificate Seed Complete ===");
}

main()
  .catch((e) => {
    console.error("Certificate seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
