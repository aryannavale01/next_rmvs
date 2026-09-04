/**
 * Low-level transactional email sender backed by real SMTP (Nodemailer).
 *
 * This is the single path used by every part of the app that sends email
 * (lib/email.ts, auth hooks, admin OTP). The SMTP connection settings and the
 * "From" identity are resolved first from the database site-settings
 * (email.smtpHost / email.smtpPort / email.smtpUser / email.smtpPass /
 * email.senderName / email.senderEmail), falling back to env vars, so admins
 * can manage delivery through the Settings page without redeploying.
 *
 * Behaviour:
 *  - In development, emails are logged by default so local work doesn't
 *    require a credential or hit a real server. Setting
 *    SEND_REAL_EMAIL_IN_DEV=1 overrides this and sends for real.
 *  - In production, emails are always sent and an SMTP host + credentials
 *    must be configured.
 */

import nodemailer, { type Transporter } from "nodemailer";
import { getOrgConfig } from "./org-config";
import { prisma, withRetry } from "./prisma";

export interface ResolvedSender {
  name: string;
  address: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
  senderName: string;
  senderEmail: string;
}

/**
 * Load SMTP configuration from the database site-settings, falling back to
 * environment variables. Returns null when no host is configured.
 */
export async function resolveSmtpConfig(): Promise<SmtpConfig | null> {
  let db: Record<string, string> = {};
  try {
    const rows = await withRetry(() =>
      prisma.siteSetting.findMany({
        where: { key: { in: [
          "email.smtpHost",
          "email.smtpPort",
          "email.smtpUser",
          "email.smtpPass",
          "email.senderName",
          "email.senderEmail",
        ] } },
        select: { key: true, value: true },
      }),
    );
    for (const row of rows) db[row.key] = row.value;
  } catch (e) {
    console.error("[email] Failed to load SMTP settings from DB:", e);
  }

  const config = await getOrgConfig();

  const host = db["email.smtpHost"]?.trim() || process.env.SMTP_HOST || "";
  if (!host) return null;

  const rawPort = db["email.smtpPort"]?.trim() || process.env.SMTP_PORT || "587";
  const port = parseInt(rawPort, 10) || 587;

  const user = db["email.smtpUser"]?.trim() || process.env.SMTP_USER || "";
  const pass = db["email.smtpPass"] || process.env.SMTP_PASS || "";

  const senderName =
    db["email.senderName"]?.trim() ||
    process.env.SMTP_SENDER_NAME ||
    config.senderName ||
    "NGO";
  const senderEmail =
    db["email.senderEmail"]?.trim() ||
    process.env.SMTP_SENDER_EMAIL ||
    config.senderEmail ||
    config.senderFromAddress;

  return {
    host,
    port,
    user,
    pass,
    secure: port === 465,
    senderName,
    senderEmail,
  };
}

/**
 * Resolve the "From: Name <address>" used on outgoing email.
 */
export async function resolveSender(): Promise<ResolvedSender> {
  const config = await getOrgConfig();
  const cfg = await resolveSmtpConfig();
  return {
    name: cfg?.senderName || config.senderName || "NGO",
    address: cfg?.senderEmail || config.senderEmail || config.senderFromAddress,
  };
}

export function shouldSendRealEmail(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  return process.env.SEND_REAL_EMAIL_IN_DEV === "1";
}

/**
 * Lazily build (and cache) a Nodemailer transport for the current SMTP config.
 * Re-created whenever the DB/env config changes.
 */
let _transport: Transporter | null = null;
let _transportKey = "";

async function getTransport(): Promise<Transporter | null> {
  const cfg = await resolveSmtpConfig();
  if (!cfg) return null;

  const key = JSON.stringify(cfg);
  if (_transport && _transportKey === key) return _transport;

  _transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
  });
  _transportKey = key;
  return _transport;
}

interface SendParams {
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Send a single email. Returns true on success (or when "sent" was simulated
 * by logging in dev). Never throws — callers get a boolean.
 */
export async function sendTransactionEmail({
  to,
  subject,
  html,
  replyTo,
}: SendParams): Promise<boolean> {
  if (!shouldSendRealEmail()) {
    console.log(`[email:dev] To: ${to.join(", ")}`);
    console.log(`[email:dev] Subject: ${subject}`);
    console.log(`[email:dev] HTML length: ${html.length} chars`);
    return true;
  }

  const transport = await getTransport();
  if (!transport) {
    console.warn("[email] SMTP not configured — skipping email send");
    return false;
  }

  const { name, address } = await resolveSender();

  try {
    await transport.sendMail({
      from: `"${name}" <${address}>`,
      to: to.join(", "),
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    return true;
  } catch (e) {
    console.error("[email] Failed to send:", e);
    return false;
  }
}

interface BatchItem {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send multiple emails over SMTP. Nodemailer has no batch endpoint, so each
 * message is sent individually through the shared transport.
 */
export async function sendTransactionBatch(
  emails: BatchItem[],
): Promise<{ sent: number; failed: number }> {
  if (!shouldSendRealEmail()) {
    console.log(`[email:dev] Batch send: ${emails.length} emails logged (not sent)`);
    return { sent: emails.length, failed: 0 };
  }

  if (emails.length === 0) return { sent: 0, failed: 0 };

  const transport = await getTransport();
  if (!transport) {
    console.warn("[email] SMTP not configured — skipping batch send");
    return { sent: 0, failed: emails.length };
  }

  const { name, address } = await resolveSender();

  let sent = 0;
  let failed = 0;
  for (const e of emails) {
    try {
      await transport.sendMail({
        from: `"${name}" <${address}>`,
        to: e.to,
        subject: e.subject,
        html: e.html,
      });
      sent++;
    } catch (err) {
      console.error(`[email] Batch item failed for ${e.to}:`, err);
      failed++;
    }
  }
  return { sent, failed };
}
