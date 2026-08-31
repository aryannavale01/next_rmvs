/**
 * Email utility — wraps Resend for transactional emails.
 *
 * All functions dynamically import Resend and org config to avoid
 * bundling issues in edge runtime.
 *
 * RESEND_API_KEY must be set in .env for emails to send.
 * In development (NODE_ENV !== 'production'), emails are logged to console.
 */

import { getOrgConfig } from "./org-config";

const SITE_URL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";

// ---------------------------------------------------------------------------
// Core sender
// ---------------------------------------------------------------------------

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams): Promise<boolean> {
  // Log in development instead of sending — check this before the API key so
  // local/dev environments work without a credential.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[email:dev] To: ${Array.isArray(to) ? to.join(", ") : to}`);
    console.log(`[email:dev] Subject: ${subject}`);
    console.log(`[email:dev] HTML length: ${html.length} chars`);
    return true;
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email send");
    return false;
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const config = await getOrgConfig();

    await resend.emails.send({
      from: `${config.senderName} <${config.senderFromAddress}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    });

    return true;
  } catch (e) {
    console.error("[email] Failed to send:", e);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Batch sender (for newsletters)
// ---------------------------------------------------------------------------

interface BatchEmail {
  to: string;
  subject: string;
  html: string;
}

export async function sendBatchEmails(emails: BatchEmail[]): Promise<{ sent: number; failed: number }> {
  // Log instead of sending in development — this must come BEFORE the API key check
  // so local/dev environments can exercise the full flow without a credential.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[email:dev] Batch send: ${emails.length} emails logged (not sent)`);
    return { sent: emails.length, failed: 0 };
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping batch send");
    return { sent: 0, failed: emails.length };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const config = await getOrgConfig();

    const batchPayload = emails.map((e) => ({
      from: `${config.senderName} <${config.senderFromAddress}>`,
      to: [e.to],
      subject: e.subject,
      html: e.html,
    }));

    // Resend batch API — sends up to 100 emails per call
    const results = await resend.batch.send(batchPayload);

    let sent = 0;
    let failed = 0;
    if (Array.isArray(results.data)) {
      for (const r of results.data) {
        if (r.id) sent++;
        else failed++;
      }
    } else {
      // All failed or unexpected shape
      failed = emails.length;
    }

    return { sent, failed };
  } catch (e) {
    console.error("[email] Batch send failed:", e);
    return { sent: 0, failed: emails.length };
  }
}

// ---------------------------------------------------------------------------
// Email: Donation pledge confirmation
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
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #059669; font-size: 24px; margin-bottom: 8px;">Thank you, ${donorName}!</h1>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">We have received your donation pledge. Our team will contact you shortly to complete the payment.</p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <table style="width: 100%; font-size: 14px;">
            <tr><td style="color: #6b7280; padding: 4px 0;">Pledge ID</td><td style="font-weight: bold; text-align: right;">${pledgeId}</td></tr>
            <tr><td style="color: #6b7280; padding: 4px 0;">Amount</td><td style="font-weight: bold; text-align: right;">${currency} ${amount.toFixed(2)}</td></tr>
            <tr><td style="color: #6b7280; padding: 4px 0;">Frequency</td><td style="font-weight: bold; text-align: right;">${frequency}</td></tr>
          </table>
        </div>

        <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">Payment methods accepted: Bank Transfer, UPI, Credit/Debit Card. You will receive payment instructions in the follow-up email.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">${config.siteName}</p>
      </div>
    `,
  });
}

// ---------------------------------------------------------------------------
// Email: Contact form confirmation
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
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #059669; font-size: 24px; margin-bottom: 8px;">We got your message, ${submitterName}!</h1>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Thank you for reaching out. We typically respond within 24 hours.</p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;"><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
          <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">Your message has been forwarded to our team. We will get back to you as soon as possible.</p>
        </div>

        <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">If your matter is urgent, please call us directly or visit our office during business hours.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">${config.siteName}</p>
      </div>
    `,
    replyTo: submitterEmail,
  });
}

// ---------------------------------------------------------------------------
// Email: Newsletter subscription welcome
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
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #059669; font-size: 24px; margin-bottom: 8px;">You're subscribed!</h1>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Thank you for joining the ${config.siteName} community. You'll receive updates on our programs, impact stories, and ways to get involved.</p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <p style="color: #166534; font-size: 14px; margin: 0; line-height: 1.5;">
            <strong>What to expect:</strong><br/>
            Monthly impact reports, program updates, volunteer opportunities, and community stories from the field.
          </p>
        </div>

        <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">You can unsubscribe at any time by clicking the unsubscribe link in any email we send.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">${config.siteName}</p>
      </div>
    `,
  });
}

// ---------------------------------------------------------------------------
// Email: Newsletter broadcast (sent to a single subscriber, called in batch)
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
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
      <h1 style="color: #059669; font-size: 24px; margin-bottom: 16px;">${title}</h1>
      <div style="color: #374151; font-size: 16px; line-height: 1.8;">
        ${body}
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

      <p style="color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.5;">
        ${config.siteName}<br/>
        <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
      </p>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Email: Enrollment application confirmation
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
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #059669; font-size: 24px; margin-bottom: 8px;">Enrollment Request Received</h1>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${applicantName}, thank you for your interest in <strong>${courseTitle}</strong>.</p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.5;">
            We have received your enrollment request. Our education team will review your application and contact you within 3–5 business days with next steps.
          </p>
        </div>

        <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">If you have any questions, please don't hesitate to reach out.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">${config.siteName}</p>
      </div>
    `,
  });
}
