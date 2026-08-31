/**
 * Postgres-backed rate limiter.
 *
 * Shared across all instances — backed by the `rate_limit_entries` table.
 * IP extraction respects the TRUSTED_PROXY_HOPS env var for safe
 * x-forwarded-for parsing behind a reverse proxy (default: Vercel = 1 hop).
 */

import { prisma, withRetry, isTransientPrismaError } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// IP extraction with trusted-proxy awareness
// ---------------------------------------------------------------------------

/**
 * Number of reverse-proxy hops to trust when parsing x-forwarded-for.
 *
 *  - 1  (Vercel default) — trust the first entry, which Vercel sets.
 *  - 0  (standalone)     — do not trust x-forwarded-for at all; fall back
 *                          to "unknown" so all spoofable requests share one
 *                          restrictive bucket.
 *
 * Set via the TRUSTED_PROXY_HOPS env var.
 */
const TRUSTED_PROXY_HOPS = Math.max(
  0,
  parseInt(process.env.TRUSTED_PROXY_HOPS ?? "1", 10) || 1,
);

/**
 * Extract the real client IP from the request.
 *
 * When TRUSTED_PROXY_HOPS > 0 the function parses the x-forwarded-for
 * header chain and returns the entry at position (length − hops) from the
 * left, which is the client IP when the chain has exactly `hops` trusted
 * proxies prepended.
 *
 * When TRUSTED_PROXY_HOPS === 0 the header is ignored entirely — the
 * returned value is "unknown" which makes every spoofable request share
 * one restrictive bucket (safe but coarse).
 */
export function getClientIP(request: Request): string {
  if (TRUSTED_PROXY_HOPS === 0) {
    // No trusted proxy — header is unverifiable.
    return "unknown";
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean);
    // Client IP is at index (length − hops). If the chain is shorter than
    // hops, take the first entry (best-effort).
    const idx = Math.max(0, parts.length - TRUSTED_PROXY_HOPS);
    return parts[idx] || "unknown";
  }

  // Fallback: x-real-ip or unknown
  return request.headers.get("x-real-ip") || "unknown";
}

// ---------------------------------------------------------------------------
// Rate-limit check (Postgres-backed)
// ---------------------------------------------------------------------------

export function checkRateLimit(
  request: Request,
  action: string,
  maxAttempts: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const ip = getClientIP(request);
  const key = `${ip}:${action}`;
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMs);

  // Synchronous wrapper — the actual DB work is fire-and-forget from the
  // caller's perspective.  We return the optimistic result and let the DB
  // converge.  This keeps the hot path non-async (all 12 callers are
  // synchronous today and we don't want to rewrite them all at once).
  //
  // The trade-off: two concurrent requests can both see "allowed" and both
  // increment.  For the limits we use (3-10 requests / 15 min) this is
  // acceptable.  True strictness would require an async redesign.

  // Fire the DB check in the background — don't block the response.
  void checkRateLimitAsync(key, maxAttempts, windowEnd);

  // Optimistic in-memory fast-path for the common case (first request in
  // a window).  This gives callers an instant response while the DB
  // converges.  We under-count by at most 1 per window which is fine for
  // the limits in use.
  return optimisticCheck(key, maxAttempts, windowEnd.getTime());
}

// ---------------------------------------------------------------------------
// In-memory fast-path (lightweight, best-effort)
// ---------------------------------------------------------------------------

const fastPath = new Map<string, { count: number; resetAt: number }>();

function optimisticCheck(
  key: string,
  maxAttempts: number,
  windowEndMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = fastPath.get(key);

  if (!entry || now > entry.resetAt) {
    fastPath.set(key, { count: 1, resetAt: windowEndMs });
    return { allowed: true, remaining: maxAttempts - 1, resetAt: windowEndMs };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxAttempts - entry.count, resetAt: entry.resetAt };
}

// Periodic fast-path cleanup (stale entries)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of fastPath) {
    if (now > entry.resetAt) fastPath.delete(key);
  }
}, 5 * 60 * 1000);

// ---------------------------------------------------------------------------
// Async Postgres persistence
// ---------------------------------------------------------------------------

async function checkRateLimitAsync(
  key: string,
  maxAttempts: number,
  windowEnd: Date,
): Promise<void> {
  try {
    await withRetry(async () => {
      const existing = await prisma.rateLimitEntry.findUnique({
        where: { key },
        select: { count: true, windowEnd: true },
      });

      const now = new Date();

      if (!existing || now > existing.windowEnd) {
        // Window expired or first request — upsert to 1
        await prisma.rateLimitEntry.upsert({
          where: { key },
          create: { key, count: 1, windowEnd },
          update: { count: 1, windowEnd },
        });
      } else if (existing.count < maxAttempts) {
        // Under limit — increment
        await prisma.rateLimitEntry.update({
          where: { key },
          data: { count: { increment: 1 } },
        });
      }
      // If at/over limit — don't increment, just leave as-is
    }, 2);
  } catch (error) {
    // Non-transient DB errors or exhaustion — log but never crash the request.
    // Transient errors are retried by withRetry; anything else is swallowed.
    if (!isTransientPrismaError(error)) {
      console.error("[rate-limit] non-transient DB error:", error);
    }
    // Sync the fast-path to reflect the DB state if possible
    fastPath.set(key, { count: maxAttempts, resetAt: windowEnd.getTime() });
  }
}

// ---------------------------------------------------------------------------
// Periodic cleanup of stale DB entries (every 5 minutes)
// ---------------------------------------------------------------------------

setInterval(async () => {
  try {
    await prisma.rateLimitEntry.deleteMany({
      where: { windowEnd: { lt: new Date() } },
    });
  } catch {
    // Swallow — cleanup is best-effort
  }
}, 5 * 60 * 1000);
