/**
 * Validates that a redirect URL is safe (relative path only, no protocol/host).
 * Prevents open redirect attacks.
 */
export function isSafeRedirect(url: string, fallback: string = "/dashboard"): string {
  if (!url || !url.startsWith("/") || url.startsWith("//") || /[a-zA-Z]:/.test(url)) {
    return fallback;
  }
  return url;
}
