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

async function ensureUser(
  email: string,
  name: string,
  password: string,
  role: "admin" | "member",
) {
  const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
    'SELECT id FROM "User" WHERE email = $1',
    email,
  );
  if (existing.length > 0) {
    console.log(`  SKIP (exists): ${email}`);
    return;
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
      'INSERT INTO profiles (id, full_name, email, role, updated_at) VALUES ($1, $2, $3, $4::user_role, $5) ON CONFLICT (id) DO NOTHING',
      id,
      name,
      email,
      role,
      now,
    );
  } catch {
    // Trigger already handled it
  }

  console.log(`  CREATED: ${email} (${role})`);
}

async function main() {
  console.log("=== Seeding Users ===\n");

  await ensureUser("admin@compassionglobal.org", "Super Admin", "Admin@123", "admin");
  await ensureUser("test.member@example.com", "Test Member", "Testuser@123", "member");

  console.log("\n=== Seed Complete ===");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
