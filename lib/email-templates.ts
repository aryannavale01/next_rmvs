/**
 * Shared, brand-consistent HTML email templates.
 *
 * Every transactional email (OTP, verification, password reset, donations,
 * contact, newsletter, enrollment) is rendered through `emailLayout` so the
 * visual identity stays uniform. Template functions are pure: they take the
 * values they need and return a full, self-contained HTML string.
 *
 * IMPORTANT: email-HTML can only use inline styles and table-based layouts.
 * Modern email clients strip <style> blocks and <head> CSS, so all styling
 * lives on the elements themselves.
 */

import { escapeHtml } from "./html-escape";

const BASE_BRAND = "#0f766e"; // teal-700, default if not overridden by org config

interface LayoutProps {
  siteName: string;
  brandColor?: string;
  title?: string;
  preheader?: string;
  children: string;
  footerNote?: string;
}

/**
 * Outer shell shared by all emails: brand header, content body, footer.
 */
export function emailLayout({
  siteName,
  brandColor = BASE_BRAND,
  title,
  preheader = "",
  children,
  footerNote,
}: LayoutProps): string {
  const brand = safeCssColor(brandColor) || BASE_BRAND;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  ${
    title
      ? `<title>${escapeHtml(title)}</title>`
      : ""
  }
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; word-spacing:normal;">
  ${preheader ? `<div style="display:none;font-size:1px;color:#f3f4f6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;"><tr><td>
        <![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">

          <!-- Brand header -->
          <tr>
            <td align="center" style="background:${brand}; padding:28px 24px;">
              <span style="color:#ffffff; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:22px; font-weight:700; letter-spacing:0.5px; line-height:1.2;">
                ${escapeHtml(siteName)}
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 28px 32px; background-color:#ffffff;">
              ${children}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px 32px 32px; background-color:#fafafa; border-top:1px solid #eef0f2;">
              <p style="margin:0 0 8px 0; color:#9ca3af; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:13px; line-height:1.6; text-align:center;">
                You are receiving this email because you are associated with ${escapeHtml(siteName)}.
              </p>
              <p style="margin:0; color:#9ca3af; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:12px; line-height:1.6; text-align:center;">
                ${footerNote ? escapeHtml(footerNote) : `© ${new Date().getFullYear()} ${escapeHtml(siteName)}. All rights reserved.`}
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ---------------------------------------------------------------------------
 * OTP email — shown here because it is the new, admin-only flow.
 * ------------------------------------------------------------------------- */

export function otpEmail({
  siteName,
  brandColor,
  userName,
  code,
  expiresInMinutes = 5,
}: {
  siteName: string;
  brandColor?: string;
  userName?: string | null;
  code: string;
  expiresInMinutes?: number;
}): string {
  const greeting = userName && userName.trim() ? escapeHtml(userName.trim()) : "there";
  const body = `
    <h1 style="margin:0 0 12px 0; color:#111827; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:22px; font-weight:700; line-height:1.3;">Your one-time login code</h1>
    <p style="margin:0 0 20px 0; color:#4b5563; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6;">
      Hi ${greeting}, use the code below to finish signing in to your ${escapeHtml(siteName)} admin account. This code expires in <strong>${expiresInMinutes} minutes</strong>.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
      <tr>
        <td align="center" style="background:#f0fdf9; border:1px solid #d1fae5; border-radius:12px; padding:22px 16px;">
          <span style="font-family:'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace; font-size:36px; font-weight:700; letter-spacing:10px; color:#0f766e;">${escapeHtml(code)}</span>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px 0; color:#6b7280; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:13px; line-height:1.6;">
      If you didn't request this code, you can ignore this email — your account is still secure.
    </p>
  `;
  return emailLayout({
    siteName,
    brandColor,
    title: `Your login code`,
    preheader: `Your ${escapeHtml(siteName)} login code — valid for ${expiresInMinutes} minutes`,
    children: body,
  });
}

/* ---------------------------------------------------------------------------
 * Password reset (OTP) — public forgot-password flow
 * ------------------------------------------------------------------------- */

export function passwordResetOtpEmail({
  siteName,
  brandColor,
  code,
  expiresInMinutes = 10,
}: {
  siteName: string;
  brandColor?: string;
  code: string;
  expiresInMinutes?: number;
}): string {
  const body = `
    <h1 style="margin:0 0 12px 0; color:#111827; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:22px; font-weight:700; line-height:1.3;">Reset your password</h1>
    <p style="margin:0 0 20px 0; color:#4b5563; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6;">
      We received a request to reset the password for your <strong>${escapeHtml(siteName)}</strong> account. Use the code below to continue. This code expires in <strong>${expiresInMinutes} minutes</strong>.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
      <tr>
        <td align="center" style="background:#f0fdf9; border:1px solid #d1fae5; border-radius:12px; padding:22px 16px;">
          <span style="font-family:'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace; font-size:36px; font-weight:700; letter-spacing:10px; color:#0f766e;">${escapeHtml(code)}</span>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px 0; color:#6b7280; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:13px; line-height:1.6;">
      If you didn't request a password reset, you can safely ignore this email — your password will stay the same.
    </p>
  `;
  return emailLayout({
    siteName,
    brandColor,
    title: "Reset your password",
    preheader: `Your ${escapeHtml(siteName)} password reset code`,
    children: body,
  });
}

/* ---------------------------------------------------------------------------
 * Email verification
 * ------------------------------------------------------------------------- */

export function verifyEmail({
  siteName,
  brandColor,
  userName,
  url,
  expiresInHours = 24,
}: {
  siteName: string;
  brandColor?: string;
  userName?: string | null;
  url: string;
  expiresInHours?: number;
}): string {
  const greeting = userName && userName.trim() ? escapeHtml(userName.trim()) : "there";
  const body = `
    <h1 style="margin:0 0 12px 0; color:#111827; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:22px; font-weight:700; line-height:1.3;">Verify your email address</h1>
    <p style="margin:0 0 20px 0; color:#4b5563; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6;">
      Hi ${greeting}, welcome to <strong>${escapeHtml(siteName)}</strong>. Please confirm your email address to activate your account.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
      <tr>
        <td align="center">
          <a href="${escapeHtml(url)}" style="display:inline-block; background-color:${safeCssColor(brandColor) || BASE_BRAND}; color:#ffffff; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:15px; font-weight:600; text-decoration:none; padding:14px 28px; border-radius:8px;">
            Verify Email
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px 0; color:#6b7280; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:13px; line-height:1.6;">
      Or copy and paste this link into your browser:<br />
      <a href="${escapeHtml(url)}" style="color:${safeCssColor(brandColor) || BASE_BRAND}; word-break:break-all;">${escapeHtml(url)}</a>
    </p>
    <p style="margin:0; color:#6b7280; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:13px; line-height:1.6;">
      This link expires in <strong>${expiresInHours} hours</strong>. If you didn't create an account, you can safely ignore this email.
    </p>
  `;
  return emailLayout({
    siteName,
    brandColor,
    title: "Verify your email",
    preheader: `Confirm your email address for ${escapeHtml(siteName)}`,
    children: body,
  });
}

/* ---------------------------------------------------------------------------
 * Password reset
 * ------------------------------------------------------------------------- */

export function resetPasswordEmail({
  siteName,
  brandColor,
  userName,
  url,
  expiresInHours = 1,
}: {
  siteName: string;
  brandColor?: string;
  userName?: string | null;
  url: string;
  expiresInHours?: number;
}): string {
  const greeting = userName && userName.trim() ? escapeHtml(userName.trim()) : "there";
  const body = `
    <h1 style="margin:0 0 12px 0; color:#111827; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:22px; font-weight:700; line-height:1.3;">Reset your password</h1>
    <p style="margin:0 0 20px 0; color:#4b5563; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6;">
      Hi ${greeting}, we received a request to reset the password for your <strong>${escapeHtml(siteName)}</strong> account.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
      <tr>
        <td align="center">
          <a href="${escapeHtml(url)}" style="display:inline-block; background-color:${safeCssColor(brandColor) || BASE_BRAND}; color:#ffffff; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:15px; font-weight:600; text-decoration:none; padding:14px 28px; border-radius:8px;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px 0; color:#6b7280; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:13px; line-height:1.6;">
      If the button above doesn't work, copy and paste this link into your browser:<br />
      <a href="${escapeHtml(url)}" style="color:${safeCssColor(brandColor) || BASE_BRAND}; word-break:break-all;">${escapeHtml(url)}</a>
    </p>
    <p style="margin:0; color:#6b7280; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:13px; line-height:1.6;">
      This link expires in <strong>${expiresInHours} hour${expiresInHours === 1 ? "" : "s"}</strong>. If you didn't request a reset, no action is needed — your password will stay the same.
    </p>
  `;
  return emailLayout({
    siteName,
    brandColor,
    title: "Reset your password",
    preheader: `Password reset request for ${escapeHtml(siteName)}`,
    children: body,
  });
}

/* ---------------------------------------------------------------------------
 * Donation pledge
 * ------------------------------------------------------------------------- */

export function donationPledgeEmail({
  siteName,
  brandColor,
  donorName,
  amount,
  currency,
  frequency,
  pledgeId,
}: {
  siteName: string;
  brandColor?: string;
  donorName: string;
  amount: number;
  currency: string;
  frequency: string;
  pledgeId: string;
}): string {
  const body = `
    <h1 style="margin:0 0 12px 0; color:#111827; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:22px; font-weight:700; line-height:1.3;">Thank you, ${escapeHtml(donorName || "friend")}!</h1>
    <p style="margin:0 0 20px 0; color:#4b5563; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6;">
      We have received your donation pledge. Our team will contact you shortly to complete your payment.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px;">
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:14px;">
            <tr>
              <td style="padding:4px 0; color:#6b7280;">Pledge ID</td>
              <td style="padding:4px 0; font-weight:600; color:#111827; text-align:right;">${escapeHtml(pledgeId)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0; color:#6b7280;">Amount</td>
              <td style="padding:4px 0; font-weight:700; color:${safeCssColor(brandColor) || BASE_BRAND}; text-align:right;">${escapeHtml(currency)} ${amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0; color:#6b7280;">Frequency</td>
              <td style="padding:4px 0; font-weight:600; color:#111827; text-align:right; text-transform:capitalize;">${escapeHtml(frequency)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0; color:#6b7280; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:13px; line-height:1.6;">
      Payment methods accepted include bank transfer, UPI, and credit/debit card. You'll receive exact instructions in a follow-up email.
    </p>
  `;
  return emailLayout({
    siteName,
    brandColor,
    title: `Donation pledge received`,
    preheader: `Thank you for supporting ${escapeHtml(siteName)}`,
    children: body,
  });
}

/* ---------------------------------------------------------------------------
 * Contact form confirmation
 * ------------------------------------------------------------------------- */

export function contactConfirmationEmail({
  siteName,
  brandColor,
  submitterName,
  subject,
}: {
  siteName: string;
  brandColor?: string;
  submitterName: string;
  subject: string;
}): string {
  const body = `
    <h1 style="margin:0 0 12px 0; color:#111827; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:22px; font-weight:700; line-height:1.3;">We got your message, ${escapeHtml(submitterName || "friend")}!</h1>
    <p style="margin:0 0 20px 0; color:#4b5563; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6;">
      Thank you for reaching out to <strong>${escapeHtml(siteName)}</strong>. We typically respond within 24 hours.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px;">
      <tr>
        <td style="padding:20px 24px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:14px; color:#374151; line-height:1.6;">
          <span style="color:#6b7280;">Subject:</span> <strong>${escapeHtml(subject || "General Inquiry")}</strong><br />
          Your message has been forwarded to our team. If your matter is urgent, please call us directly or visit during business hours.
        </td>
      </tr>
    </table>
  `;
  return emailLayout({
    siteName,
    brandColor,
    title: `Message received`,
    preheader: `Thanks for reaching out to ${escapeHtml(siteName)}`,
    children: body,
  });
}

/* ---------------------------------------------------------------------------
 * Newsletter welcome
 * ------------------------------------------------------------------------- */

export function newsletterWelcomeEmail({
  siteName,
  brandColor,
}: {
  siteName: string;
  brandColor?: string;
}): string {
  const body = `
    <h1 style="margin:0 0 12px 0; color:#111827; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:22px; font-weight:700; line-height:1.3;">You're subscribed!</h1>
    <p style="margin:0 0 20px 0; color:#4b5563; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6;">
      Thank you for joining the <strong>${escapeHtml(siteName)}</strong> community. You'll receive updates on our programs, impact stories, and ways to get involved.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0; background:#f0fdf9; border:1px solid #d1fae5; border-radius:12px;">
      <tr>
        <td style="padding:20px 24px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:14px; color:#166534; line-height:1.7;">
          <strong>What to expect:</strong><br />
          Monthly impact reports, program updates, volunteer opportunities, and community stories from the field.
        </td>
      </tr>
    </table>
    <p style="margin:0; color:#6b7280; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:13px; line-height:1.6;">
      You can unsubscribe at any time using the link in any email we send.
    </p>
  `;
  return emailLayout({
    siteName,
    brandColor,
    title: "Welcome to our newsletter",
    preheader: `You're subscribed to ${escapeHtml(siteName)}`,
    children: body,
  });
}

/* ---------------------------------------------------------------------------
 * Newsletter broadcast (single subscriber body; called in batch)
 * ------------------------------------------------------------------------- */

export function newsletterBroadcastHtml({
  siteName,
  brandColor,
  title,
  safeBody,
  unsubscribeUrl,
}: {
  siteName: string;
  brandColor?: string;
  title: string;
  safeBody: string;
  unsubscribeUrl: string;
}): string {
  const body = `
    <h1 style="margin:0 0 16px 0; color:#111827; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:24px; font-weight:700; line-height:1.3;">${escapeHtml(title || "")}</h1>
    <div style="color:#374151; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:1.8; margin:0 0 24px 0;">
      ${safeBody}
    </div>
    <p style="margin:24px 0 0 0; color:#9ca3af; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:12px; text-align:center;">
      <a href="${escapeHtml(unsubscribeUrl)}" style="color:#9ca3af; text-decoration:underline;">Unsubscribe</a> from ${escapeHtml(siteName)} emails.
    </p>
  `;
  return emailLayout({
    siteName,
    brandColor,
    title,
    preheader: title,
    children: body,
    footerNote: "",
  });
}

/* ---------------------------------------------------------------------------
 * Enrollment confirmation
 * ------------------------------------------------------------------------- */

export function enrollmentConfirmationEmail({
  siteName,
  brandColor,
  applicantName,
  courseTitle,
}: {
  siteName: string;
  brandColor?: string;
  applicantName: string;
  courseTitle: string;
}): string {
  const body = `
    <h1 style="margin:0 0 12px 0; color:#111827; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:22px; font-weight:700; line-height:1.3;">Enrollment request received</h1>
    <p style="margin:0 0 20px 0; color:#4b5563; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6;">
      Hi ${escapeHtml(applicantName || "there")}, thank you for your interest in <strong>${escapeHtml(courseTitle || "our program")}</strong>.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px;">
      <tr>
        <td style="padding:20px 24px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:14px; color:#374151; line-height:1.7;">
          We have received your enrollment request. Our education team will review your application and contact you within 3–5 business days with next steps.
        </td>
      </tr>
    </table>
    <p style="margin:0; color:#6b7280; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:13px; line-height:1.6;">
      If you have any questions, please don't hesitate to reach out.
    </p>
  `;
  return emailLayout({
    siteName,
    brandColor,
    title: "Enrollment request received",
    preheader: `We received your enrollment request for ${escapeHtml(courseTitle)}`,
    children: body,
  });
}

/**
 * Keep a CSS color safe to interpolate into inline styles. Returns the raw
 * value only if it looks like a hex/rgb color, otherwise falls back to null
 * (callers then use the brand default).
 */
function safeCssColor(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return v;
  if (/^rgb(a)?\([\d\s,./%]+\)$/.test(v)) return v;
  return null;
}
