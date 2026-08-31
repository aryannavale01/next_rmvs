import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@better-auth/utils/password";
import * as crypto from "node:crypto";

const DIRECT_URL = process.env.DIRECT_URL!;
if (!DIRECT_URL) throw new Error("DIRECT_URL is required");

const MEMBER_PASSWORD: string = process.env.MEMBER_PASSWORD!;
if (!MEMBER_PASSWORD) throw new Error("MEMBER_PASSWORD is required");

const prisma = new PrismaClient({
  datasources: { db: { url: DIRECT_URL } },
});

function uuid(): string {
  return crypto.randomUUID();
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log("=== Seed 5 Applications Without Document Verification ===\n");

  const courses = await prisma.$queryRawUnsafe<{ id: string; title: string }[]>(
    "SELECT id, title FROM courses WHERE status = 'active' LIMIT 2"
  );
  if (courses.length === 0) {
    console.error("FATAL: no active courses found. Run the main seed first.");
    process.exit(1);
  }
  console.log(`Found ${courses.length} active course(s): ${courses.map((c) => c.title).join(", ")}\n`);

  let created = 0;

  for (let i = 0; i < 5; i++) {
    const course = courses[i % courses.length];
    const email = `test.nodocs_${i}@example.com`;

    // Check if user already exists
    const existingUser = await prisma.$queryRawUnsafe<{ id: string }[]>(
      'SELECT id FROM "User" WHERE email = $1',
      email,
    );

    let pid: string;

    if (existingUser.length > 0) {
      pid = existingUser[0].id;
      // Check for existing application
      const existingApp = await prisma.$queryRawUnsafe<{ id: string }[]>(
        "SELECT id FROM course_applications WHERE profile_id = $1 AND course_id = $2",
        pid,
        course.id,
      );
      if (existingApp.length > 0) {
        console.log(`  SKIP: ${email} already applied to "${course.title}"`);
        continue;
      }
    } else {
      // Create User + Account + Profile
      pid = crypto.randomBytes(16).toString("hex");
      const now = new Date();
      const password = MEMBER_PASSWORD;

      await prisma.$executeRawUnsafe(
        'INSERT INTO "User" (id, email, "emailVerified", name, role, "mustChangePassword", "lastLoginAt", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5::"Role", $6, $7, $8, $9)',
        pid,
        email,
        true,
        `No-Docs Test ${i + 1}`,
        "MEMBER",
        false,
        now,
        now,
        now,
      );

      const hashedPw = await hashPassword(password);
      await prisma.$executeRawUnsafe(
        'INSERT INTO "Account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
        crypto.randomBytes(16).toString("hex"),
        pid,
        crypto.randomBytes(12).toString("hex"),
        "credential",
        hashedPw,
        now,
        now,
      );

      await prisma.$executeRawUnsafe(
        "INSERT INTO profiles (id, full_name, email, phone, role, created_at, updated_at) VALUES ($1, $2, $3, $4, 'member'::user_role, $5, $6)",
        pid,
        `No-Docs Test ${i + 1}`,
        email,
        `99999999${String(i + 1).padStart(2, "0")}`,
        now,
        now,
      );
      console.log(`  CREATED profile: No-Docs Test ${i + 1} (${email})`);
    }

    await prisma.$executeRawUnsafe(
      `INSERT INTO course_applications (
        id, profile_id, course_id, applied_date, status,
        documents, notes, coupon_applied, payment_status,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, 'pending'::application_status,
        $5::jsonb, $6, false, 'pending'::payment_status,
        NOW(), NOW()
      )`,
      uuid(),
      pid,
      course.id,
      daysAgo(i * 5 + 1),
      JSON.stringify([
        { type: "aadhaar", status: "pending" },
        { type: "photo", status: "pending" },
      ]),
      `Seed: no-docs test application #${i + 1}`,
    );
    console.log(`  CREATED app: No-Docs Test ${i + 1} -> "${course.title}" (all docs pending)`);
    created++;
  }

  console.log(`\nDone: ${created} applications created with zero verified documents`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
