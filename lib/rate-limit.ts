/**
 * In-memory rate limiter — SINGLE INSTANCE ONLY.
 *
 * WARNING: This uses a process-level Map that is not shared across instances.
 * In production with multiple workers/pods, each instance tracks its own
 * counters, allowing N × maxAttempts through before any single instance blocks.
 *
 * For multi-instance deployments, replace with Redis-backed rate limiting
 * (e.g., @upstash/ratelimit) or rely on Better Auth's built-in database-backed
 * rate limiting (configured in lib/auth.ts).
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function checkRateLimit(
  request: Request,
  action: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const ip = getClientIP(request);
  const key = `${ip}:${action}`;
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxAttempts - entry.count, resetAt: entry.resetAt };
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (now > entry.resetAt) attempts.delete(key);
  }
}, 5 * 60 * 1000);
