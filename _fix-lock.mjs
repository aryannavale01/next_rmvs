import { PrismaClient } from "@prisma/client";

// Use pooled URL with executeRaw which works on pgbouncer
const p = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.wioogtvmkadvljcvnkya:%40ryan%402004Navale@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});

try {
  // PgBouncer transaction mode allows these
  await p.$executeRawUnsafe("SET session_replication_role = 'replica'");
  await p.$executeRawUnsafe("SET session_replication_role = 'origin'");
  console.log("Pooled connection works");
  
  const tables = await p.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name LIKE 'User'");
  console.log("User table check:", JSON.stringify(tables));
  
  const tables2 = await p.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name");
  console.log("All tables:", tables2.map(t => t.table_name).join(", "));
} catch (e) {
  console.error("Error:", e.message);
}

await p.$disconnect();
