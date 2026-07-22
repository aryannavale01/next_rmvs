import { PrismaClient } from "@prisma/client";

const directUrl = "postgresql://postgres:%40ryan%402004Navale@db.wioogtvmkadvljcvnkya.supabase.co:5432/postgres";
const p = new PrismaClient({ datasources: { db: { url: directUrl } } });

// Force-release the persistent lock by terminating the backend that holds it
await p.$executeRawUnsafe(`
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE pg_backend_pid() <> pid
    AND state = 'idle in transaction'
`);

// Also specifically release lock 72707369
await p.$executeRawUnsafe("SELECT pg_advisory_unlock(72707369)");
await p.$executeRawUnsafe("SELECT pg_advisory_unlock_all()");
console.log("Locks released");

await p.$disconnect();
