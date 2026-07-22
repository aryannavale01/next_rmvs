import { PrismaClient } from "@prisma/client";

const directUrl = "postgresql://postgres:%40ryan%402004Navale@db.wioogtvmkadvljcvnkya.supabase.co:5432/postgres";
const p = new PrismaClient({ datasources: { db: { url: directUrl } } });

try {
  await p.$executeRawUnsafe(
    `ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey"
     FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE`
  );
  console.log("FK added successfully");
} catch (e) {
  console.log("FK error:", e.message.substring(0, 100));
}

// Verify
const fks = await p.$queryRawUnsafe(`
  SELECT tc.constraint_name, ccu.table_name AS foreign_table
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'profiles'
`);
console.log("profiles FK constraints:", fks.length);
for (const fk of fks) console.log(`  ${fk.constraint_name} -> ${fk.foreign_table}`);

await p.$disconnect();
