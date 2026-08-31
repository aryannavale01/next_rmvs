import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signed unsubscribe links.
 *
 * The unsubscribe endpoint is an unauthenticated GET (email links are crawled
 * by link-previewers/AV scanners), so it must NOT accept a bare email. Each
 * link carries an HMAC token derived from the email, bound to the server
 * secret, so only the exact link we mailed can trigger an unsubscribe.
 */

function secret(): Buffer {
  const value = process.env.BETTER_AUTH_SECRET;
  // Same length-check the auth module enforces; if the secret is missing we
  // cannot sign tokens, so fail loudly rather than sign with an empty key.
  if (!value || value.length < 32) {
    throw new Error(
      "[unsubscribe-token] BETTER_AUTH_SECRET is required to sign unsubscribe links.",
    );
  }
  return Buffer.from(value, "utf8");
}

export function buildUnsubscribeToken(email: string): string {
  return createHmac("sha256", secret()).update(email.toLowerCase().trim()).digest("base64url");
}

export function verifyUnsubscribeToken(email: string, token: string | null): boolean {
  if (!token) return false;
  const expected = Buffer.from(buildUnsubscribeToken(email), "utf8");
  const provided = Buffer.from(token, "utf8");
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}