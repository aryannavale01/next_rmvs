import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";
import { validatePassword } from "./password-validation";
import { prisma } from "./prisma";

// --- Startup validation: fail loudly if required env vars are missing/weak ---
function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(`[Auth] Required environment variable ${name} is not set. Cannot start.`);
  }
  return val;
}

const isProd = process.env.NODE_ENV === "production";

const authSecret = requireEnv("BETTER_AUTH_SECRET");

if (authSecret.length < 32) {
  throw new Error(
    `[Auth] BETTER_AUTH_SECRET must be at least 32 characters (got ${authSecret.length}). ` +
    `Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
  );
}

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3462";

const trustedOrigins = process.env.TRUSTED_ORIGINS
  ? process.env.TRUSTED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : isProd
    ? []
    : ["http://localhost:3462", "http://localhost:3000", "http://localhost:3006"];

let _validated = false;
function validateProductionConfig() {
  if (_validated || !isProd) return;
  _validated = true;
  if (baseURL.includes("localhost")) {
    console.error("[Auth] CRITICAL: BETTER_AUTH_URL must not contain localhost in production. Current:", baseURL);
  }
  if (trustedOrigins.length === 0) {
    console.error("[Auth] CRITICAL: TRUSTED_ORIGINS must be set in production.");
  }
}
validateProductionConfig();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    password: {},
    sendResetPassword: async ({ user, url }) => {
      if (process.env.NODE_ENV !== "production") {
        const token = url.split("token=")[1]?.split("&")[0] || "unknown";
        console.log(`[Password Reset] ${user.email} — token: ${token.substring(0, 8)}...`);
        return;
      }
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "noreply@compassionglobal.org",
          to: user.email,
          subject: "Reset Your Password — CompassionGlobal",
          html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p>
                 <p><a href="${url}">Reset Password</a></p>
                 <p>If you didn't request this, ignore this email.</p>`,
        });
      } catch (e) {
        console.error("[sendResetPassword] Failed to send email:", e);
      }
    },
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      if (process.env.NODE_ENV !== "production") {
        const token = url.split("token=")[1]?.split("&")[0] || "unknown";
        console.log(`[Email Verification] ${user.email} — token: ${token.substring(0, 8)}...`);
        return;
      }
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "noreply@compassionglobal.org",
          to: user.email,
          subject: "Verify Your Email — CompassionGlobal",
          html: `<p>Welcome to CompassionGlobal! Please verify your email address by clicking the link below.</p>
                 <p><a href="${url}">Verify Email</a></p>
                 <p>This link expires in 24 hours. If you didn't create an account, ignore this email.</p>`,
        });
      } catch (e) {
        console.error("[sendVerificationEmail] Failed to send email:", e);
      }
    },
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
  plugins: [
    twoFactor({
      issuer: "CompassionGlobal",
    }),
  ],
  rateLimit: {
    window: 60,
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || "100", 10),
    storage: process.env.NODE_ENV === "production" ? "database" : "memory",
    customRules: {
      "/sign-in/email": {
        window: 900,
        max: 5,
      },
      "/sign-up/email": {
        window: 900,
        max: 3,
      },
      "/request-password-reset": {
        window: 900,
        max: 3,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const password = (user as Record<string, unknown>).password as string | undefined;
          if (password) {
            const result = validatePassword(password);
            if (!result.valid) {
              throw new Error(result.errors.join("; "));
            }
          }
          return { data: user };
        },
        after: async (user) => {
          try {
            const existing = await prisma.profile.findUnique({ where: { id: user.id } });
            if (existing) return;
            await prisma.profile.create({
              data: {
                id: user.id,
                fullName: (user as Record<string, unknown>).name as string || user.email.split("@")[0],
                email: user.email,
                role: "member" as const,
              },
            });
          } catch (e) {
            console.error("[ensureProfile] Failed to create profile for user:", user.id, e);
          }
        },
      },
    },
    session: {
      create: {
        after: async (session, ctx) => {
          try {
            const userId = session.userId as string;
            // Look up user role to log admin logins
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { role: true },
            });
            if (user?.role === "ADMIN") {
              await prisma.authActivityLog.create({
                data: {
                  userId,
                  action: "admin_login_success",
                  ip: ctx?.request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim()
                    || ctx?.request?.headers?.get("x-real-ip")
                    || null,
                },
              });
            }
          } catch {
            // Audit logging failure should never break auth flow
          }
        },
      },
    },
    account: {
      update: {
        before: async (data) => {
          const newPassword = (data as Record<string, unknown>).password as string | undefined;
          if (newPassword) {
            const result = validatePassword(newPassword);
            if (!result.valid) {
              throw new Error(result.errors.join("; "));
            }
          }
          return { data };
        },
      },
    },
  },
});
