import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const r1 = await prisma.user.updateMany({ data: { mustChangePassword: false, twoFactorEnabled: false } });
  console.log('Cleared mustChangePassword + twoFactorEnabled for', r1.count, 'users');

  await prisma.$executeRawUnsafe('DELETE FROM "twoFactor"');
  console.log('Cleared twoFactor records');

  await prisma.siteSetting.upsert({
    where: { key: 'security.enable2FA' },
    update: { value: 'false' },
    create: { key: 'security.enable2FA', value: 'false', label: 'Two-Factor Authentication', category: 'security' },
  });
  console.log('Set security.enable2FA = false');
}
main().finally(() => prisma.$disconnect());
