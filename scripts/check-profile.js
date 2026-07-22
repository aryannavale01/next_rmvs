require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } }
});
p.$queryRawUnsafe('SELECT id, full_name, email, role FROM profiles WHERE id = $1', '9q4g1FinEni1APFWYSFUBmo8lCpIOuy1')
  .then(r => { console.log(JSON.stringify(r, null, 2)); })
  .catch(e => { console.error('ERROR:', e.message); })
  .finally(() => p.$disconnect());
