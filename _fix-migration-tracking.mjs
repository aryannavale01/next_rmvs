import { PrismaClient } from "@prisma/client";

const directUrl = "postgresql://postgres:%40ryan%402004Navale@db.wioogtvmkadvljcvnkya.supabase.co:5432/postgres";
const p = new PrismaClient({ datasources: { db: { url: directUrl } } });

// Create _prisma_migrations table manually so Prisma recognizes the migration state
await p.$executeRawUnsafe(`
  CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    id VARCHAR(36) PRIMARY KEY,
    checksum VARCHAR(64) NOT NULL,
    finished_at TIMESTAMPTZ,
    migration_name VARCHAR(255) NOT NULL,
    logs TEXT,
    rolled_back_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    applied_steps_count INTEGER NOT NULL DEFAULT 0
  )
`);
console.log("Created _prisma_migrations table");

// Read the init migration SQL to compute a checksum
import { readFileSync } from "fs";
import crypto from "crypto";
const migrationSql = readFileSync("E:/next_rmvs/prisma/migrations/20260720064509_init/migration.sql", "utf-8");


const checksum = crypto.createHash("sha256").update(migrationSql).digest("hex");

// Insert the init migration as applied
await p.$executeRawUnsafe(
  `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
   VALUES ($1, $2, NOW(), '20260720064509_init', 1)`,
  crypto.randomUUID(), checksum
);
console.log("Registered init migration");

// Verify
const migrations = await p.$queryRawUnsafe("SELECT migration_name, finished_at FROM \"_prisma_migrations\" ORDER BY finished_at");
console.log("Migration state:");
for (const m of migrations) {
  console.log(`  ${m.migration_name} @ ${m.finished_at}`);
}

// Also verify FK on profiles
const fks = await p.$queryRawUnsafe(`
  SELECT tc.constraint_name, ccu.table_name AS foreign_table
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'profiles'
`);
console.log("\nprofiles FK constraints:");
for (const fk of fks) console.log(`  ${fk.constraint_name} -> ${fk.foreign_table}`);

// Verify Profile.id has no default
const col = await p.$queryRawUnsafe(`
  SELECT column_default FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id'
`);
console.log(`\nprofiles.id default: ${col[0]?.column_default || "(none)"}`);

// Verify BA tables
const baCheck = await p.$queryRawUnsafe(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    AND table_name IN ('User', 'Session', 'Account', 'Verification')
  ORDER BY table_name
`);
console.log("\nBetter Auth tables:", baCheck.map(t => t.table_name).join(", "));

await p.$disconnect();
