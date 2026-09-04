/**
 * Public "forgot password" OTP flow.
 *
 * Mirrors the admin login OTP (`lib/admin-otp.ts`) but is accessible to any
 * user (member or admin) who has access to their registered email. Unlike the
 * admin flow it does NOT require a session — the whole point is that the user
 * is locked out.
 *
 * Flow:
 *   1. User submits their email  → a 6-digit code is emailed (hashed at rest).
 *   2. User submits email + code → validated, consumed, and a short-lived,
 *      single-use reset token is issued.
 *   3. User submits reset token + new password → password is re-hashed with
 *      better-auth's own hasher and written to the credential account.
 *
 * Security properties:
 *   - Codes are stored as HMAC-SHA256 hashes (never plaintext), keyed with
 *     BETTER_AUTH_SECRET.
 *   - Codes expire (default 10 min) and are attempt-limited (default 5).
 *   - Requesting a new code invalidates previous pending challenges.
 *   - Response shapes never reveal whether an email exists (no enumeration).
 *   - The reset token is random, short-lived, single-use, and only issued
 *     after a correct OTP, so the API cannot be used to brute force a reset.
 */

import { createHmac, randomBytes, randomInt, randomUUID } from "crypto";
import { prisma, withRetry } from "./prisma";
import { getOrgConfig } from "./org-config";
import { sendTransactionEmail } from "./email-sender";
import { passwordResetOtpEmail } from "./email-templates";
import { validatePasswordWithConfig } from "./password-validation";
import { logAuthEvent, AuditActions } from "./audit-log";

export const RESET_OTP_LENGTH = 6;
export const RESET_OTP_EXPIRES_MS = 10 * 60 * 1000; // 10 minutes
export const RESET_OTP_MAX_ATTEMPTS = 5;
export const RESET_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

function resetSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET not set");
  return secret;
}

function hashOtpCode(code: string): string {
  return createHmac("sha256", resetSecret())
    .update(`password-reset-otp:${code.trim()}`)
    .digest("hex");
}

// Constant-time compare of two hex-encoded buffers.
function safeHexEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

function generateOtpCode(): string {
  const bytes = new Uint8Array(RESET_OTP_LENGTH);
  for (let i = 0; i < RESET_OTP_LENGTH; i++) bytes[i] = randomInt(0, 10);
  return Array.from(bytes).join("");
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "your email";
  if (!local) return `***@${domain}`;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

/**
 * Look up a user by email. Returns null when not found (callers must NOT
 * reveal this — they return the same "if this email exists, a code was sent"
 * response regardless).
 */
async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return withRetry(() =>
    prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, name: true },
    }),
  );
}

/**
 * Look up the credential (email/password) account for a user. This is the row
 * whose `password` field we update on reset.
 */
async function findCredentialAccount(userId: string) {
  return withRetry(() =>
    prisma.account.findFirst({
      where: { userId, providerId: "credential" },
      select: { id: true },
    }),
  );
}

/**
 * Step 1 — request a password reset: generate an OTP, email it, store its
 * hash. Always returns a success-shaped result so emails cannot be enumerated.
 */
export async function requestPasswordResetOtp({
  email,
  ip,
}: {
  email: string;
  ip?: string;
}): Promise<{ ok: true }> {
  const normalized = email.trim().toLowerCase();
  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + RESET_OTP_EXPIRES_MS);

  // Invalidate previous pending challenges for this email.
  await withRetry(() =>
    prisma.passwordResetOtp.updateMany({
      where: { email: normalized, consumedAt: null, expiresAt: { gt: new Date() } },
      data: { consumedAt: new Date() },
    }),
  );

  await withRetry(() =>
    prisma.passwordResetOtp.create({
      data: { email: normalized, codeHash, expiresAt, attempts: 0 },
    }),
  );

  const user = await findUserByEmail(normalized);
  const config = await getOrgConfig();

  // Dev/test helper: surface the plaintext code so automated E2E suites can
  // complete the flow without reading a real inbox. NEVER enabled in prod.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[forgot-password:test] CODE ${code} EMAIL ${normalized}`);
  }

  // Best-effort audit only when the account exists (don't log unknown emails).
  if (user) {
    await logAuthEvent({
      userId: user.id,
      action: AuditActions.OTP_SENT,
      metadata: { email: normalized, purpose: "password_reset" },
      ip,
    });
  }

  // Always attempt to send, regardless of whether the account exists — this
  // returns before the caller learns anything, and unknown emails just get a
  // code for an account that will never accept it.
  const delivered = await sendTransactionEmail({
    to: [email.trim()],
    subject: `Reset your password — ${config.siteName}`,
    html: passwordResetOtpEmail({
      siteName: config.siteName,
      brandColor: config.brandColor,
      code,
      expiresInMinutes: Math.round(RESET_OTP_EXPIRES_MS / 60000),
    }),
  });

  console.log(`[forgot-password] code requested for ${maskEmail(normalized)} (delivered: ${delivered})`);

  return { ok: true };
}

/**
 * Step 2 — verify the OTP for an email. On success, consumes the challenge and
 * mints a short-lived, single-use reset token bound to the user.
 */
export async function verifyPasswordResetOtp({
  email,
  code,
  ip,
}: {
  email: string;
  code: string;
  ip?: string;
}): Promise<
  | { ok: true; resetToken: string; maskedEmail: string }
  | { ok: false; error: string; status: number }
> {
  const normalized = email.trim().toLowerCase();
  const trimmed = code.trim();

  if (!/^\d{6}$/.test(trimmed)) {
    return { ok: false, error: "Enter the 6-digit code from your email.", status: 400 };
  }

  const challenge = await withRetry(() =>
    prisma.passwordResetOtp.findFirst({
      where: { email: normalized, consumedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  );

  if (!challenge) {
    return { ok: false, error: "No active code found. Request a new code.", status: 400 };
  }

  if (challenge.expiresAt.getTime() < Date.now()) {
    await logAuthEvent({ action: AuditActions.OTP_FAILED, metadata: { reason: "expired", email: normalized }, ip });
    return { ok: false, error: "This code has expired. Request a new code.", status: 401 };
  }

  if (challenge.attempts >= RESET_OTP_MAX_ATTEMPTS) {
    await logAuthEvent({ action: AuditActions.OTP_FAILED, metadata: { reason: "attempts_exhausted", email: normalized }, ip });
    return { ok: false, error: "Too many incorrect attempts. Request a new code.", status: 429 };
  }

  const valid = safeHexEqual(challenge.codeHash, hashOtpCode(trimmed));
  if (!valid) {
    await withRetry(() =>
      prisma.passwordResetOtp.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      }),
    );
    await logAuthEvent({ action: AuditActions.OTP_FAILED, metadata: { reason: "invalid_code", email: normalized }, ip });
    return { ok: false, error: "Incorrect code. Please try again.", status: 401 };
  }

  const user = await findUserByEmail(normalized);
  if (!user) {
    // Defensive: account was removed between step 1 and step 2.
    await withRetry(() =>
      prisma.passwordResetOtp.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      }),
    );
    return { ok: false, error: "Unable to reset the password for this account.", status: 400 };
  }

  const resetToken = randomBytes(32).toString("hex");
  const tokenId = `password-reset:${resetToken}`;
  const tokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  // Atomically consume the OTP challenge and store the reset token in the
  // better-auth `verification` table (value = userId).
  await withRetry(() =>
    prisma.$transaction([
      prisma.passwordResetOtp.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      }),
      prisma.verification.create({
        data: {
          id: randomUUID(),
          identifier: tokenId,
          value: user.id,
          expiresAt: tokenExpiresAt,
        },
      }),
    ]),
  );

  return { ok: true, resetToken, maskedEmail: maskEmail(normalized) };
}

/**
 * Step 3 — reset the password. The caller must present the short-lived reset
 * token obtained from a successful OTP verification, plus the new password.
 */
export async function resetPasswordWithToken({
  resetToken,
  newPassword,
  ip,
}: {
  resetToken: string;
  newPassword: string;
  ip?: string;
}): Promise<
  | { ok: true }
  | { ok: false; error: string; status: number }
> {
  const token = resetToken.trim();
  if (!token) {
    return { ok: false, error: "Invalid reset token.", status: 400 };
  }

  const tokenId = `password-reset:${token}`;

  // Enforce password policy BEFORE consuming the token so a bad password
  // doesn't invalidate a fresh token (user can retry with a better one).
  const validation = await validatePasswordWithConfig(newPassword);
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join(" "), status: 400 };
  }

  // Find + consume the verification in one step.
  const verification = await withRetry(() =>
    prisma.verification.findFirst({ where: { identifier: tokenId } }),
  );

  if (!verification) {
    return { ok: false, error: "This reset link is invalid or has expired. Start again.", status: 400 };
  }

  if (verification.expiresAt.getTime() < Date.now()) {
    await withRetry(() =>
      prisma.verification.delete({ where: { id: verification.id } }).catch(() => undefined),
    );
    return { ok: false, error: "This reset link has expired. Start again.", status: 401 };
  }

  const userId = verification.value;
  const credential = await findCredentialAccount(userId);
  if (!credential) {
    return { ok: false, error: "No password is set for this account.", status: 400 };
  }

  const { hashPassword } = await import("better-auth/crypto");
  const hashed = await hashPassword(newPassword);

  await withRetry(() =>
    prisma.$transaction([
      prisma.account.update({
        where: { id: credential.id },
        data: { password: hashed },
      }),
      prisma.verification.delete({ where: { id: verification.id } }),
      // If a forced password change flag was set, clear it now that the user
      // has set a new password themselves.
      prisma.user.updateMany({
        where: { id: userId, mustChangePassword: true },
        data: { mustChangePassword: false },
      }),
    ]),
  );

  await logAuthEvent({
    userId,
    action: AuditActions.PASSWORD_CHANGE,
    metadata: { method: "email_otp" },
    ip,
  });

  return { ok: true };
}
