import { PrismaClient } from "@prisma/client";

const directUrl = "postgresql://postgres:%40ryan%402004Navale@db.wioogtvmkadvljcvnkya.supabase.co:5432/postgres";
const p = new PrismaClient({ datasources: { db: { url: directUrl } } });

// Terminate any backend holding advisory locks and release
try {
  await p.$executeRawUnsafe("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE query LIKE '%advisory%' AND pid <> pg_backend_pid()");
  console.log("Terminated lock-holding backends");
} catch (e) {
  console.log("Terminate result:", e.message);
}

try {
  await p.$executeRawUnsafe("SELECT pg_advisory_unlock_all()");
  console.log("Unlocked");
} catch (e) {
  console.log("Unlock result:", e.message);
}

// Verify
try {
  const tables = await p.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name");
  console.log("Tables found:", tables.length);
} catch (e) {
  console.log("Verify error:", e.message);
}

await p.$disconnect();
