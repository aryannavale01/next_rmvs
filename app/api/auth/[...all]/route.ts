import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = 'force-dynamic';

const { POST: authPOST, GET: authGET } = toNextJsHandler(auth);

// IP-based brute-force protection for sensitive auth actions. Better Auth
// handles the authentication itself; we add a coarse per-IP window on top.
const AUTH_RATE_LIMITS: { suffix: string; max: number; windowMs: number }[] = [
  { suffix: "/sign-in/email", max: 10, windowMs: 15 * 60 * 1000 },
  { suffix: "/sign-up/email", max: 5, windowMs: 60 * 60 * 1000 },
  { suffix: "/forget-password", max: 5, windowMs: 60 * 60 * 1000 },
  { suffix: "/request-password-reset", max: 5, windowMs: 60 * 60 * 1000 },
  { suffix: "/verify-email", max: 10, windowMs: 15 * 60 * 1000 },
  { suffix: "/send-verification-email", max: 5, windowMs: 60 * 60 * 1000 },
];

function authRateLimit(req: NextRequest): NextResponse | null {
  const url = new URL(req.url);
  const pathname = url.pathname;
  for (const rule of AUTH_RATE_LIMITS) {
    if (pathname.endsWith(rule.suffix)) {
      const result = checkRateLimit(req, `auth${rule.suffix}`, rule.max, rule.windowMs);
      if (!result.allowed) {
        return NextResponse.json(
          { error: 'Too many attempts. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))),
            },
          },
        );
      }
      break;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const limited = authRateLimit(request);
  if (limited) return limited;
  return authPOST(request);
}

export async function GET(request: NextRequest) {
  return authGET(request);
}
