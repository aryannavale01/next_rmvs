import { PrismaClient } from "@prisma/client";
const p = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL! } } });
async function main() {
  const cols = await p.$queryRawUnsafe("SELECT column_name, column_default, is_nullable, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' ORDER BY ordinal_position");
  for (const c of cols) console.log(c.column_name + " | default=" + (c.column_default||"none") + " | nullable=" + c.is_nullable + " | type=" + c.data_type);
  await p.$disconnect();
}
main().catch(console.error);
