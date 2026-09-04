/**
 * Admin-only email OTP flow.
 *
 * After an administrator provides email + password at /admin/login they are
 * redirected here to complete a one-time-code challenge sent to their email.
 * Members are never routed through this flow.
 *
 * Design:
 *  - Codes are 6 random digits, stored as an HMAC-SHA256 hash (never plaintext),
 *    keyed with BETTER_AUTH_SECRET.
 *  - A challenge row (AdminOtp) is created per send. Sending a new code
 *    invalidates the user's previous pending challenges so only the newest
 *    code is usable.
 *  - Verification is time-limited (default 5 min) and attempt-limited (default 5).
 *  - On success the session's stepUpVerifiedAt is set (reusing the existing
 *    step-up marker) — callers that need the session id perform that update.
 */

import { createHmac, randomInt } from "crypto";
import { prisma, withRetry } from "./prisma";
import { getOrgConfig } from "./org-config";
import { sendTransactionEmail } from "./email-sender";
import { otpEmail } from "./email-templates";
import { logAuthEvent, AuditActions } from "./audit-log";

export const OTP_CODE_LENGTH = 6;
export const OTP_EXPIRES_MS_DEFAULT = 5 * 60 * 1000; // 5 minutes
export const OTP_MAX_ATTEMPTS = 5;

function otpSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET not set");
  return secret;
}

export function generateOtpCode(length: number = OTP_CODE_LENGTH): string {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = randomInt(0, 10); // secure, uniform digit
  }
  return Array.from(bytes).join("");
}

export function hashOtpCode(code: string): string {
  return createHmac("sha256", otpSecret()).update(`admin-otp:${code}`).digest("hex");
}

// Constant-time comparer for two hex strings (code hashes).
export function safeHexEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

/**
 * Create and send an OTP challenge for the given admin.
 * Invalidates previous pending challenges for the same user, then emails the
 * code. Returns { success, maskedEmail }.
 */
export async function sendAdminOtp({
  userId,
  email,
  userName,
  ip,
}: {
  userId: string;
  email: string;
  userName?: string | null;
  ip?: string;
}): Promise<{ success: boolean; maskedEmail: string }> {
  const maskedEmail = maskEmail(email);

  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MS_DEFAULT);

  const config = await getOrgConfig();

  // Invalidate previous pending challenges for this user.
  await withRetry(() =>
    prisma.adminOtp.updateMany({
      where: { userId, consumedAt: null, expiresAt: { gt: new Date() } },
      data: { consumedAt: new Date() },
    })
  );

  await withRetry(() =>
    prisma.adminOtp.create({
      data: {
        userId,
        email,
        codeHash,
        expiresAt,
        attempts: 0,
      },
    })
  );

  await logAuthEvent({
    userId,
    action: AuditActions.OTP_SENT,
    metadata: { email, expiresInMinutes: Math.round(OTP_EXPIRES_MS_DEFAULT / 60000) },
    ip,
  });

  const html = otpEmail({
    siteName: config.siteName,
    brandColor: config.brandColor,
    userName,
    code,
    expiresInMinutes: Math.round(OTP_EXPIRES_MS_DEFAULT / 60000),
  });

  const sent = await sendTransactionEmail({
    to: [email],
    subject: `Your login code — ${config.siteName}`,
    html,
  });

  return { success: sent, maskedEmail };
}

/**
 * Verify a submitted OTP code for the given user/session.
 * Sets consumedAt on success and stepUpVerifiedAt on the session.
 * Returns { ok: true } or { ok: false, error, status, retryable? }.
 */
export async function verifyAdminOtp({
  userId,
  email,
  code,
  sessionId,
  ip,
}: {
  userId: string;
  email: string;
  code: string;
  sessionId: string;
  ip?: string;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const normalized = code.trim();
  if (!/^\d{6}$/.test(normalized)) {
    return { ok: false, error: "Enter the 6-digit code from your email.", status: 400 };
  }

  const challenge = await withRetry(() =>
    prisma.adminOtp.findFirst({
      where: { userId, consumedAt: null },
      orderBy: { createdAt: "desc" },
    })
  );

  if (!challenge) {
    return { ok: false, error: "No active code found. Request a new code.", status: 400 };
  }

  if (challenge.expiresAt.getTime() < Date.now()) {
    await logAuthEvent({ userId, action: AuditActions.OTP_FAILED, metadata: { reason: "expired" }, ip });
    return { ok: false, error: "This code has expired. Request a new code.", status: 401 };
  }

  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    await logAuthEvent({ userId, action: AuditActions.OTP_FAILED, metadata: { reason: "attempts_exhausted" }, ip });
    return { ok: false, error: "Too many incorrect attempts. Request a new code.", status: 429 };
  }

  const valid = safeHexEqual(challenge.codeHash, hashOtpCode(normalized));

  if (!valid) {
    await withRetry(() =>
      prisma.adminOtp.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      })
    );
    await logAuthEvent({ userId, action: AuditActions.OTP_FAILED, metadata: { reason: "invalid_code" }, ip });
    return { ok: false, error: "Incorrect code. Please try again.", status: 401 };
  }

  // Consume the challenge and mark the session as OTP-verified (reusing the
  // existing step-up marker so sensitive actions remain recent-auth gated too).
  await withRetry(() =>
    prisma.$transaction([
      prisma.adminOtp.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } }),
      prisma.session.update({
        where: { id: sessionId },
        data: { stepUpVerifiedAt: new Date() },
      }),
    ])
  );

  await logAuthEvent({ userId, action: AuditActions.OTP_VERIFIED, metadata: { email }, ip });

  return { ok: true };
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "your email";
  if (!local) return `***@${domain}`;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  const visiblePrefix = local.slice(0, 2);
  const visibleSuffix = local.slice(-1);
  return `${visiblePrefix}***${visibleSuffix}@${domain}`;
}
