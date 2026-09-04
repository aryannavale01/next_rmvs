/**
 * Email utility — high-level transactional email senders.
 *
 * All rendering lives in lib/email-templates.ts (brand-consistent HTML) and
 * all sending goes through lib/email-sender.ts (Resend). These functions only
 * need to know the business data and call the right template + sender.
 */

import { getOrgConfig } from "./org-config";
import { sanitizeHtmlContent } from "./sanitize-html";
import {
  sendTransactionEmail,
  sendTransactionBatch,
} from "./email-sender";
import {
  donationPledgeEmail,
  contactConfirmationEmail,
  newsletterWelcomeEmail,
  newsletterBroadcastHtml,
  enrollmentConfirmationEmail,
} from "./email-templates";

// Re-export the low-level guard so auth hooks share the same send path.
export { sendTransactionEmail, sendTransactionBatch } from "./email-sender";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/** Thin wrapper kept for backward-compat with existing callers. */
export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams): Promise<boolean> {
  return sendTransactionEmail({
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    replyTo,
  });
}

interface BatchEmail {
  to: string;
  subject: string;
  html: string;
}

export async function sendBatchEmails(emails: BatchEmail[]): Promise<{ sent: number; failed: number }> {
  return sendTransactionBatch(emails);
}

// ---------------------------------------------------------------------------
// Donation pledge confirmation
// ---------------------------------------------------------------------------

export async function sendDonationPledgeEmail({
  donorName,
  donorEmail,
  amount,
  currency,
  frequency,
  pledgeId,
}: {
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  frequency: string;
  pledgeId: string;
}): Promise<boolean> {
  const config = await getOrgConfig();
  return sendEmail({
    to: donorEmail,
    subject: `Donation Pledge Received — ${config.siteName}`,
    html: donationPledgeEmail({
      siteName: config.siteName,
      brandColor: config.brandColor,
      donorName,
      amount,
      currency,
      frequency,
      pledgeId,
    }),
  });
}

// ---------------------------------------------------------------------------
// Contact form confirmation
// ---------------------------------------------------------------------------

export async function sendContactConfirmationEmail({
  submitterName,
  submitterEmail,
  subject,
}: {
  submitterName: string;
  submitterEmail: string;
  subject: string;
}): Promise<boolean> {
  const config = await getOrgConfig();
  return sendEmail({
    to: submitterEmail,
    subject: `Message Received — ${config.siteName}`,
    html: contactConfirmationEmail({
      siteName: config.siteName,
      brandColor: config.brandColor,
      submitterName,
      subject,
    }),
    replyTo: submitterEmail,
  });
}

// ---------------------------------------------------------------------------
// Newsletter subscription welcome
// ---------------------------------------------------------------------------

export async function sendNewsletterWelcomeEmail({
  subscriberEmail,
}: {
  subscriberEmail: string;
}): Promise<boolean> {
  const config = await getOrgConfig();
  return sendEmail({
    to: subscriberEmail,
    subject: `Welcome to Our Newsletter — ${config.siteName}`,
    html: newsletterWelcomeEmail({
      siteName: config.siteName,
      brandColor: config.brandColor,
    }),
  });
}

// ---------------------------------------------------------------------------
// Newsletter broadcast (single subscriber body; called in batch)
// ---------------------------------------------------------------------------

export async function buildNewsletterBroadcastHtml({
  title,
  body,
  unsubscribeUrl,
}: {
  title: string;
  body: string;
  unsubscribeUrl: string;
}): Promise<string> {
  const config = await getOrgConfig();
  const safeBody = sanitizeHtmlContent(body);
  return newsletterBroadcastHtml({
    siteName: config.siteName,
    brandColor: config.brandColor,
    title,
    safeBody,
    unsubscribeUrl,
  });
}

// ---------------------------------------------------------------------------
// Enrollment application confirmation
// ---------------------------------------------------------------------------

export async function sendEnrollmentConfirmationEmail({
  applicantName,
  applicantEmail,
  courseTitle,
}: {
  applicantName: string;
  applicantEmail: string;
  courseTitle: string;
}): Promise<boolean> {
  const config = await getOrgConfig();
  return sendEmail({
    to: applicantEmail,
    subject: `Enrollment Request Received — ${config.siteName}`,
    html: enrollmentConfirmationEmail({
      siteName: config.siteName,
      brandColor: config.brandColor,
      applicantName,
      courseTitle,
    }),
  });
}
