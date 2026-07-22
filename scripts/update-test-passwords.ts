import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@better-auth/utils/password";
import * as crypto from "node:crypto";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL! } },
});

const users = [
  { email: "admin@compassionglobal.org", name: "Super Admin", password: "Admin@123", role: "ADMIN" as const },
  { email: "test.member@example.com", name: "Test Member", password: "Testuser@123", role: "MEMBER" as const },
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
        console.log(`  UPDATED: ${email} → ${password}`);
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
        console.log(`  CREATED ACCOUNT: ${email} → ${password}`);
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

    console.log(`  CREATED: ${email} (${role}) → ${password}`);
  }

  console.log("\n=== Done ===");
}

main().catch((e) => { console.error("Failed:", e); process.exit(1); }).finally(() => prisma.$disconnect());
