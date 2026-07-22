import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const runtimeUrl = process.env.DIRECT_URL;
if (!runtimeUrl) throw new Error("DIRECT_URL is required for Better Auth client");

const prisma = new PrismaClient({
  datasources: { db: { url: runtimeUrl } },
});

prisma.$connect().catch(() => {});

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3462";

const trustedOrigins = process.env.TRUSTED_ORIGINS
  ? process.env.TRUSTED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3462", "http://localhost:3000", "http://localhost:3006"];

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    password: {},
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 5,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    cookiePrefix: "cg.",
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
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
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || "100", 10),
  },
});
