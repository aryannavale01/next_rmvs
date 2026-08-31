import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL! } },
});

const [command, arg] = process.argv.slice(2);

if (!command || !arg) {
  console.error('Usage: npx tsx scripts/e2e-journey-helper.ts <verify|cleanup> <email|userId>');
  process.exit(1);
}

async function findUserId(identifier: string): Promise<string | null> {
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    'SELECT id FROM "User" WHERE email = $1 OR id = $1 LIMIT 1',
    identifier,
  );
  return rows.length ? rows[0].id : null;
}

async function verifyEmail(email: string): Promise<void> {
  const id = await findUserId(email);
  if (!id) {
    console.log(`USER_NOT_FOUND ${email}`);
    return;
  }
  // Flip Better Auth email verification (simulates clicking the verification link).
  await prisma.$executeRawUnsafe(
    'UPDATE "User" SET "emailVerified" = TRUE WHERE id = $1',
    id,
  );
  await prisma.$executeRawUnsafe(
    'UPDATE profiles SET email_verified = TRUE WHERE id = $1',
    id,
  );
  console.log(`VERIFIED ${email} (${id})`);
}

async function cleanup(identifier: string): Promise<void> {
  const id = await findUserId(identifier);
  if (!id) {
    console.log(`USER_NOT_FOUND ${identifier}`);
    return;
  }
  // Delete related rows (FK order matters). Use raw deletes to avoid relying on cascade config everywhere.
  const tables = [
    'certificate',
    'course_enrollment',
    'course_application',
    'beneficiary_documents',
    'beneficiary_addresses',
    'beneficiary_details',
    'notification',
    'activity',
    'coupon_redemption',
    'testimonial',
    'auth_activity_log',
    'login_attempt',
    'two_factor',
    'session',
    'account',
    'profile',
    'User',
  ];
  for (const t of tables) {
    try {
      const col = t === 'User' ? 'id' : 'profile_id';
      const idCol = t === 'session' || t === 'account' || t === 'auth_activity_log' ||
                    t === 'login_attempt' || t === 'two_factor' ? 'user_id' : null;
      const sql = idCol
        ? `DELETE FROM "${t}" WHERE "${idCol}" = $1`
        : `DELETE FROM "${t}" WHERE "${col}" = $1`;
      await prisma.$executeRawUnsafe(sql, id);
    } catch {
      // Table may not exist (e.g. some feature tables) — ignore.
    }
  }
  console.log(`CLEANED ${identifier}`);
}

(async () => {
  if (command === 'verify') {
    await verifyEmail(arg);
  } else if (command === 'cleanup') {
    await cleanup(arg);
  } else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
})().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
  process.exit(0);
});
