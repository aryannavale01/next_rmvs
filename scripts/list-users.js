require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } }
});
async function main() {
  const users = await p.$queryRawUnsafe(
    `SELECT id, email, name, role FROM "User" ORDER BY "createdAt" ASC`
  );
  console.log("All users:");
  console.log(JSON.stringify(users, null, 2));
}
main().catch(e => { console.error('ERROR:', e.message); }).finally(() => p.$disconnect());
