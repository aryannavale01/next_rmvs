/**
 * Allow-list HTML sanitizer for rich-text content (e.g. newsletter bodies).
 *
 * Uses isomorphic-dompurify so the same sanitizer works on the server
 * (write-time + email render) and in the browser (admin preview render).
 *
 * The allow-list intentionally excludes <script> and all event-handler
 * attributes; DOMPurify also blocks javascript: and data: URIs by default.
 */
import DOMPurify from "isomorphic-dompurify";
import type { Config } from "isomorphic-dompurify";

const SANITIZE_OPTIONS: Config = {
  ALLOWED_TAGS: [
    "p", "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s", "del", "small",
    "blockquote", "ul", "ol", "li",
    "a", "img", "br", "hr",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td",
    "span", "div", "pre", "code", "sub", "sup",
  ],
  ALLOWED_ATTR: [
    "href", "src", "alt", "title", "width", "height",
    "class", "target", "rel",
  ],
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
  KEEP_CONTENT: true,
};

export function sanitizeHtmlContent(value: unknown): string {
  if (typeof value !== "string") return "";
  return DOMPurify.sanitize(value, SANITIZE_OPTIONS) as unknown as string;
}
