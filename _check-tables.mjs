import { PrismaClient } from "@prisma/client";

const directUrl = "postgresql://postgres:%40ryan%402004Navale@db.wioogtvmkadvljcvnkya.supabase.co:5432/postgres";

const p = new PrismaClient({ datasources: { db: { url: directUrl } } });

const tables = await p.$queryRawUnsafe(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
);
console.log(JSON.stringify(tables.map(t => t.table_name)));

// Check for _prisma_migrations
try {
  const m = await p.$queryRawUnsafe("SELECT migration_name, finished_at FROM \"_prisma_migrations\" ORDER BY finished_at");
  console.log("Migrations:", JSON.stringify(m));
} catch (e) {
  console.log("No migration table:", e.message.substring(0, 100));
}

// Check User table
try {
  const u = await p.$queryRawUnsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'User' ORDER BY ordinal_position");
  console.log("User columns:", JSON.stringify(u));
} catch (e) {
  console.log("No User table:", e.message.substring(0, 100));
}

await p.$disconnect();
