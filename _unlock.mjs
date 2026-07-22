import { PrismaClient } from "@prisma/client";

// Use direct connection with a client that bypasses the lock
// by using a new session with the direct URL
const p = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:%40ryan%402004Navale@db.wioogtvmkadvljcvnkya.supabase.co:5432/postgres"
    }
  }
});

try {
  await p.$executeRawUnsafe("SELECT pg_advisory_unlock_all()");
  console.log("Advisory locks released");
} catch (e) {
  console.error("Lock release error:", e.message);
}

try {
  const tables = await p.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name");
  const tableNames = tables.map(t => t.table_name);
  console.log("Tables now:", tableNames.join(", "));
  
  const baTables = ["User", "Session", "Account", "Verification"];
  for (const bt of baTables) {
    console.log(`  ${bt}: ${tableNames.includes(bt) ? "EXISTS" : "MISSING"}`);
  }
} catch (e) {
  console.error("Table list error:", e.message);
}

// Check migration history
try {
  const migrations = await p.$queryRawUnsafe("SELECT migration_name, finished_at, rolled_back_at FROM \"_prisma_migrations\" ORDER BY finished_at");
  console.log("\nMigration history:");
  for (const m of migrations) {
    console.log(`  ${m.migration_name} | finished: ${m.finished_at} | rolled_back: ${m.rolled_back_at}`);
  }
} catch (e) {
  console.error("Migration history error:", e.message);
}

await p.$disconnect();
