/**
 * One-time backfill: Create Profile rows for any User records
 * that don't have a corresponding Profile.
 *
 * Run with: npx tsx scripts/backfill-profiles.ts
 *
 * Safe to run multiple times — skips Users that already have Profiles.
 */

import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";

const DIRECT_URL = process.env.DIRECT_URL;
if (!DIRECT_URL) throw new Error("DIRECT_URL is required");

const prisma = new PrismaClient({
  datasources: { db: { url: DIRECT_URL } },
});

async function main() {
  console.log("=== Backfill Profiles ===\n");

  const users = await prisma.$queryRawUnsafe<{ id: string; email: string; name: string | null }[]>(
    'SELECT id, email, name FROM "User"'
  );

  const profiles = await prisma.$queryRawUnsafe<{ id: string }[]>(
    'SELECT id FROM profiles'
  );

  const profileIds = new Set(profiles.map((p) => p.id));
  const orphans = users.filter((u) => !profileIds.has(u.id));

  if (orphans.length === 0) {
    console.log("All Users already have Profiles. Nothing to backfill.");
    return;
  }

  console.log(`Found ${orphans.length} User(s) without Profiles:\n`);

  let created = 0;
  for (const user of orphans) {
    const fullName = user.name || user.email.split("@")[0];
    try {
      await prisma.$executeRawUnsafe(
        'INSERT INTO profiles (id, full_name, email, role, created_at, updated_at) VALUES ($1, $2, $3, $4::user_role, $5, $6)',
        user.id,
        fullName,
        user.email,
        "member",
        new Date(),
        new Date()
      );
      console.log(`  CREATED: ${user.email} (${user.id})`);
      created++;
    } catch (e) {
      console.error(`  FAILED: ${user.email} — ${e}`);
    }
  }

  console.log(`\n=== Backfill Complete: ${created}/${orphans.length} Profiles created ===`);
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
