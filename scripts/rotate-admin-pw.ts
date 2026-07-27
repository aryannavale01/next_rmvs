import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@better-auth/utils/password";
import * as crypto from "node:crypto";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL! } },
});

function generatePassword(): string {
  // 20 bytes = 26 base64url chars. Insert guaranteed uppercase, digit, special.
  const raw = crypto.randomBytes(20).toString("base64url");
  // Ensure at least one uppercase, one digit, one special char
  const special = "!@#$%^&*";
  return (
    raw.charAt(0).toUpperCase() +
    raw.slice(1, 10) +
    crypto.randomInt(10).toString() +
    raw.slice(10, 18) +
    special[crypto.randomInt(special.length)] +
    raw.slice(18)
  );
}

async function main() {
  const pw = generatePassword();
  const hashed = await hashPassword(pw);

  const user = await prisma.$queryRawUnsafe<{ id: string }[]>(
    'SELECT id FROM "User" WHERE email = $1',
    "admin@compassionglobal.org",
  );
  if (user.length === 0) {
    console.error("Admin user not found");
    process.exit(1);
  }

  await prisma.$executeRawUnsafe(
    'UPDATE "Account" SET password = $1 WHERE "userId" = $2 AND "providerId" = $3',
    hashed,
    user[0].id,
    "credential",
  );
  console.log("ADMIN_PASSWORD=" + pw);
  await prisma.$disconnect();
}

main();
