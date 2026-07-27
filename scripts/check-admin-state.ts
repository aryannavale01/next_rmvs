import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL! } },
});

async function main() {
  console.log("=== Superadmin Account Diagnostic ===\n");

  // 1. User row
  const user = await prisma.$queryRawUnsafe<{
    id: string;
    email: string;
    role: string;
    mustChangePassword: boolean;
    twoFactorEnabled: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
  }[]>(
    'SELECT id, email, role, "mustChangePassword", "twoFactorEnabled", "lastLoginAt", "createdAt" FROM "User" WHERE email = $1',
    "admin@compassionglobal.org",
  );

  if (user.length === 0) {
    console.log("ERROR: admin@compassionglobal.org not found in User table");
    return;
  }

  const u = user[0];
  console.log("USER TABLE:");
  console.log(`  id:                ${u.id}`);
  console.log(`  email:             ${u.email}`);
  console.log(`  role:              ${u.role}`);
  console.log(`  mustChangePassword: ${u.mustChangePassword}`);
  console.log(`  twoFactorEnabled:  ${u.twoFactorEnabled}`);
  console.log(`  lastLoginAt:       ${u.lastLoginAt}`);
  console.log(`  createdAt:         ${u.createdAt}`);
  console.log(`  role === "ADMIN":  ${u.role === "ADMIN"}`);

  // 2. Latest session row
  const sessions = await prisma.$queryRawUnsafe<{
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    stepUpVerifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }[]>(
    'SELECT id, token, "userId", "expiresAt", "stepUpVerifiedAt", "createdAt", "updatedAt" FROM "Session" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 3',
    u.id,
  );

  console.log(`\nSESSION TABLE (${sessions.length} recent sessions):`);
  for (const s of sessions) {
    const now = new Date();
    const expired = s.expiresAt < now;
    console.log(`  ---`);
    console.log(`  id:              ${s.id}`);
    console.log(`  userId:          ${s.userId} (matches user: ${s.userId === u.id})`);
    console.log(`  expiresAt:       ${s.expiresAt} (expired: ${expired})`);
    console.log(`  stepUpVerifiedAt: ${s.stepUpVerifiedAt}`);
    console.log(`  createdAt:       ${s.createdAt}`);
    console.log(`  updatedAt:       ${s.updatedAt}`);
  }

  // 3. Profile row
  const profiles = await prisma.$queryRawUnsafe<{
    id: string;
    email: string;
    role: string;
    full_name: string;
  }[]>(
    'SELECT id, email, role, full_name FROM profiles WHERE email = $1',
    "admin@compassionglobal.org",
  );

  console.log(`\nPROFILES TABLE (${profiles.length} rows):`);
  for (const p of profiles) {
    console.log(`  id:        ${p.id}`);
    console.log(`  email:     ${p.email}`);
    console.log(`  role:      ${p.role}`);
    console.log(`  full_name: ${p.full_name}`);
  }

  // 4. Check the "Role" enum type values in PostgreSQL
  const enumValues = await prisma.$queryRawUnsafe<{ enumlabel: string }[]>(
    "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role') ORDER BY enumsortorder",
  );
  console.log(`\nPOSTGRESQL "Role" ENUM VALUES:`);
  for (const e of enumValues) {
    console.log(`  ${e.enumlabel}`);
  }

  // 5. Check "user_role" enum type values
  const userRoleValues = await prisma.$queryRawUnsafe<{ enumlabel: string }[]>(
    "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role') ORDER BY enumsortorder",
  );
  console.log(`\nPOSTGRESQL "user_role" ENUM VALUES:`);
  for (const e of userRoleValues) {
    console.log(`  ${e.enumlabel}`);
  }

  // 6. Raw pg_typeof check on the actual role value
  const typeCheck = await prisma.$queryRawUnsafe<{typeof: string; actual_value: string}[]>(
    'SELECT pg_typeof(role)::text AS typeof, role::text AS actual_value FROM "User" WHERE email = $1',
    "admin@compassionglobal.org",
  );
  console.log(`\nRAW ROLE TYPE CHECK:`);
  for (const t of typeCheck) {
    console.log(`  pg_typeof:    ${t.typeof}`);
    console.log(`  actual_value: ${t.actual_value}`);
  }

  console.log("\n=== Done ===");
}

main()
  .catch((e) => {
    console.error("Diagnostic failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
