require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } }
});
async function main() {
  // Check LoginAttempt table exists
  const tables = await p.$queryRawUnsafe(`
    SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename='LoginAttempt'
  `);
  console.log('LoginAttempt table:', JSON.stringify(tables));
  
  // Check indexes
  const indexes = await p.$queryRawUnsafe(`
    SELECT indexname FROM pg_indexes WHERE tablename='LoginAttempt'
  `);
  console.log('Indexes:', JSON.stringify(indexes));
}
main().catch(e => { console.error('ERROR:', e.message); }).finally(() => p.$disconnect());
