import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

// NOTE: ARCHITECTURE.md §5.1 says DATABASE_URL (pooled, port 6543) should be used
// for runtime and DIRECT_URL only for migrations. Currently using DIRECT_URL because
// the Supabase pooler hostname (aws-0-ap-south-1.pooler.supabase.com) fails DNS
// resolution (ENOTFOUND) from this environment. Switch to DATABASE_URL once the
// pooler endpoint is reachable — that gives connection pooling and avoids per-query
// TCP+TLS+connection-setup overhead.
const runtimeUrl = process.env.DIRECT_URL;
if (!runtimeUrl) throw new Error("DIRECT_URL is required for Better Auth client");

const prisma = new PrismaClient({
  datasources: { db: { url: runtimeUrl } },
});

// Eagerly connect so cold-start doesn't fail on first sign-in
prisma.$connect().catch(() => {
  // Will retry on actual query
});

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3462";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL,
  trustedOrigins: ["http://localhost:3462", "http://localhost:3000", "http://localhost:3006"],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    password: {},
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 5,
  },
  advanced: {
    cookiePrefix: "cg.",
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "MEMBER",
        input: false,
      },
    },
  },
  rateLimit: {
    window: 60,
    max: 100,
  },
});
