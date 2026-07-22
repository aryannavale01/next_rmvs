require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } }
});
async function main() {
  const rows = await p.$queryRawUnsafe(
    `SELECT id, identifier, value, "expiresAt" FROM "Verification" ORDER BY "expiresAt" DESC LIMIT 10`
  );
  console.log(JSON.stringify(rows, null, 2));
}
main().catch(e => { console.error('ERROR:', e.message); }).finally(() => p.$disconnect());
