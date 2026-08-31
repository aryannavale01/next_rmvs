import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import puppeteer, { type Browser, type PDFOptions } from "puppeteer-core";
import QRCode from "qrcode";
import type { CertificatePdfData } from "./certificate-pdf";

// ---------------------------------------------------------------------------
// Asset resolution
// ---------------------------------------------------------------------------

const DEFAULT_ASSETS_DIR = "assets/.aistudio";
const DEFAULT_TEMPLATE_FILE = "english_professional_certificate.html";

const CANDIDATE_CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

function assetsDir(): string {
  const configured = process.env.CERTIFICATE_ASSETS_DIR;
  return path.isAbsolute(configured ?? "")
    ? (configured as string)
    : path.resolve(process.cwd(), configured ?? DEFAULT_ASSETS_DIR);
}

function templatePath(): string {
  return path.join(assetsDir(), process.env.CERTIFICATE_TEMPLATE_FILE ?? DEFAULT_TEMPLATE_FILE);
}

function resolveChromePath(): string {
  const fromEnv = process.env.CHROME_PATH;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  for (const candidate of CANDIDATE_CHROME_PATHS) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    "No Chrome/Chromium executable found. Install Chrome or set CHROME_PATH in your environment.",
  );
}

// ---------------------------------------------------------------------------
// Template loading
// ---------------------------------------------------------------------------

let cachedTemplate: Promise<string> | null = null;

function loadTemplate(): Promise<string> {
  if (!cachedTemplate) {
    cachedTemplate = fs.readFile(templatePath(), "utf8");
  }
  return cachedTemplate;
}

async function inlineImage(html: string, file: string): Promise<string> {
  try {
    const data = await fs.readFile(path.join(assetsDir(), file));
    return html.replace(
      `src="${file}"`,
      `src="data:image/png;base64,${data.toString("base64")}"`,
    );
  } catch {
    return html;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

// ---------------------------------------------------------------------------
// Render one certificate to HTML (user's template, used as-is)
// ---------------------------------------------------------------------------

export async function renderCertificateHtml(data: CertificatePdfData): Promise<string> {
  const template = await loadTemplate();
  let html = template;

  html = html.replace("Applicant's Name", escapeHtml(data.fullName));
  html = html.replace("Course Name", escapeHtml(data.courseTitle));

  html = html.replace(
    'title="Click to customize duration">Duration</span>',
    'title="Click to customize duration">—</span>',
  );
  html = html.replace(
    'title="Click to customize start date">Start Date</span>',
    'title="Click to customize start date">—</span>',
  );
  html = html.replace(
    'title="Click to customize end date">End Date</span>',
    'title="Click to customize end date">—</span>',
  );
  html = html.replace(
    'title="Click to edit date">Date of Issue</span>',
    `title="Click to edit date">${escapeHtml(formatDate(data.issueDate))}</span>`,
  );

  const qrTarget = data.verificationUrl ?? data.certificateNumber;
  const verificationCode = data.verificationCode ?? data.certificateNumber;
  const qrDataUrl = await QRCode.toDataURL(qrTarget, {
    width: 256,
    margin: 1,
    color: { dark: "#512270", light: "#ffffff" },
  });
  html = html.replace(/src="https:\/\/api\.qrserver\.com[^"]*"/, `src="${qrDataUrl}"`);
  html = html.replace("RMVS-2026-T8924", escapeHtml(data.certificateNumber));

  // Inject verification code text near the QR area
  html = html.replace(
    /(<div[^>]*id="qr-section"[^>]*>)/,
    `$1<p style="font-size:9px;color:#64748b;margin-top:4px;">Verification Code: <strong>${escapeHtml(verificationCode)}</strong></p>`,
  );

  html = await inlineImage(html, "certification_circular-removebg-preview.png");
  html = await inlineImage(html, "certification_stamp-removebg-preview.png");

  return html;
}

// ---------------------------------------------------------------------------
// HTML -> PDF via system Chrome
// ---------------------------------------------------------------------------

const PDF_OPTIONS: PDFOptions = {
  format: "A4",
  landscape: true,
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: 0, bottom: 0, left: 0, right: 0 },
};

async function launchChrome(): Promise<Browser> {
  return puppeteer.launch({
    executablePath: resolveChromePath(),
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--font-render-hinting=none",
    ],
  });
}

/**
 * Render each certificate to a separate PDF buffer using the user's HTML
 * template. One headless Chrome instance is reused across the batch.
 */
export async function renderCertificatePdfBuffers(certs: CertificatePdfData[]): Promise<Buffer[]> {
  if (certs.length === 0) return [];

  const htmls = await Promise.all(certs.map(renderCertificateHtml));
  const browser = await launchChrome();

  try {
    const page = await browser.newPage();
    const buffers: Buffer[] = [];

    for (const html of htmls) {
      await page.setContent(html, { waitUntil: "load", timeout: 45_000 });
      await page.waitForNetworkIdle({ idleTime: 500, timeout: 45_000 });
      await page.evaluate(() => document.fonts.ready);
      buffers.push(Buffer.from(await page.pdf(PDF_OPTIONS)));
    }

    return buffers;
  } finally {
    await browser.close();
  }
}
