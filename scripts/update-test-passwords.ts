import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@better-auth/utils/password";
import * as crypto from "node:crypto";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL! } },
});

const adminPassword = process.env.ADMIN_PASSWORD;
const testMemberPassword = process.env.TEST_MEMBER_PASSWORD;

if (!adminPassword || !testMemberPassword) {
  console.error("ERROR: ADMIN_PASSWORD and TEST_MEMBER_PASSWORD environment variables are required.");
  console.error("Usage: ADMIN_PASSWORD=... TEST_MEMBER_PASSWORD=... npx tsx scripts/update-test-passwords.ts");
  process.exit(1);
}

const users = [
  { email: "admin@compassionglobal.org", name: "Super Admin", password: adminPassword, role: "ADMIN" as const },
  { email: "test.member@example.com", name: "Test Member", password: testMemberPassword, role: "MEMBER" as const },
];

async function main() {
  console.log("=== Seeding Users ===\n");

  for (const { email, name, password, role } of users) {
    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
      'SELECT id FROM "User" WHERE email = $1',
      email,
    );

    if (existing.length > 0) {
      // Update password
      const accountId = await prisma.$queryRawUnsafe<{ id: string }[]>(
        'SELECT id FROM "Account" WHERE "userId" = $1 AND "providerId" = $2',
        existing[0].id,
        "credential",
      );

      if (accountId.length > 0) {
        const hashed = await hashPassword(password);
        await prisma.$executeRawUnsafe(
          'UPDATE "Account" SET password = $1 WHERE id = $2',
          hashed,
          accountId[0].id,
        );
        console.log(`  UPDATED: ${email}`);
      } else {
        // Create account for existing user
        const hashed = await hashPassword(password);
        await prisma.$executeRawUnsafe(
          'INSERT INTO "Account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          crypto.randomBytes(16).toString("hex"),
          existing[0].id,
          crypto.randomBytes(12).toString("hex"),
          "credential",
          hashed,
        );
        console.log(`  CREATED ACCOUNT: ${email}`);
      }
      continue;
    }

    // Create user + account
    const id = crypto.randomBytes(16).toString("hex");
    const hashed = await hashPassword(password);

    await prisma.$executeRawUnsafe(
      'INSERT INTO "User" (id, email, "emailVerified", name, role, "mustChangePassword", "lastLoginAt", "createdAt", "updatedAt") VALUES ($1, $2, true, $3, $4::"Role", false, NOW(), NOW(), NOW())',
      id, email, name, role,
    );

    await prisma.$executeRawUnsafe(
      'INSERT INTO "Account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
      crypto.randomBytes(16).toString("hex"),
      id,
      crypto.randomBytes(12).toString("hex"),
      "credential",
      hashed,
    );

    await prisma.$executeRawUnsafe(
      'INSERT INTO profiles (id, full_name, email, role, updated_at) VALUES ($1, $2, $3, $4::user_role, NOW()) ON CONFLICT (id) DO NOTHING',
      id, name, email, role === "ADMIN" ? "admin" : "member",
    );

    console.log(`  CREATED: ${email} (${role})`);
  }

  console.log("\n=== Done ===");
}

main().catch((e) => { console.error("Failed:", e); process.exit(1); }).finally(() => prisma.$disconnect());
