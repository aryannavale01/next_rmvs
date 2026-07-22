import { PrismaClient } from "@prisma/client";
const p = new PrismaClient({
  datasources: { db: { url: "postgresql://postgres:%40ryan%402004Navale@db.wioogtvmkadvljcvnkya.supabase.co:5432/postgres" } }
});

const tables = await p.$queryRawUnsafe(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
);
console.log(`Table count: ${tables.length}`);
for (const t of tables) {
  console.log(`  - ${t.table_name}`);
}

const cols = await p.$queryRawUnsafe(
  "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' ORDER BY ordinal_position"
);
console.log("\nprofiles columns:");
for (const c of cols) {
  console.log(`  ${c.column_name}  ${c.data_type}  nullable=${c.is_nullable}`);
}

const fks = await p.$queryRawUnsafe(
  `SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'profiles'`
);
console.log("\nprofiles FK constraints:");
if (fks.length === 0) {
  console.log("  (none)");
}
for (const fk of fks) {
  console.log(`  ${fk.constraint_name}: ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
}

await p.$disconnect();
