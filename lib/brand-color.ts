/**
 * Validation for the brand color used by the public/admin <style> blocks.
 *
 * Only fully-anchored hex colors (#RGB or #RRGGBB) are accepted. Any other
 * value (CSS injection, arbitrary strings) is rejected so a malicious value
 * can never be interpolated into the :root { --brand-primary: ... } CSS.
 */
const BRAND_COLOR_RE = /^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/;

export const DEFAULT_BRAND_COLOR = "#2563EB";

export function isValidBrandColor(value: string): boolean {
  return BRAND_COLOR_RE.test(value);
}

export function safeBrandColor(value: string | null | undefined): string {
  return typeof value === "string" && isValidBrandColor(value)
    ? value
    : DEFAULT_BRAND_COLOR;
}
