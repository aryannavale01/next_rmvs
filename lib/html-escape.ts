/**
 * Escape a plain-text value for safe interpolation into HTML templates.
 *
 * Shared by transactional emails and certificate rendering so the escaping
 * logic stays in a single, consistent place.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
