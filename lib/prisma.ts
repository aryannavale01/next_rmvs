import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

// Global singleton — prevents multiple Prisma Client instances in dev (hot-reload)
// Uses DIRECT_URL (session-mode pooler, port 5432) explicitly because the
// transaction-mode pooler (DATABASE_URL, port 6543) is unreachable from this network.
// Once the Supabase transaction-mode pooler is accessible, switch back to default
// (no datasources override) to benefit from connection pooling under load.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL } },
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Prisma error codes that indicate a transient database/pooler failure where
 * retrying the query is likely to succeed. NOT authentication or validation
 * errors — those must never be retried.
 */
const TRANSIENT_PRISMA_CODES = new Set([
  "P1001", // Can't reach database server
  "P1017", // Server has closed the connection
  "P2024", // Connection pool timed out
  "P2037", // Too many connections
]);

export function isTransientPrismaError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    TRANSIENT_PRISMA_CODES.has((error as { code: string }).code)
  );
}

/**
 * Wraps a Prisma query with retry logic for transient database failures
 * (connection refused, dropped connection, pool exhaustion).
 * Uses exponential backoff: 1s → 2s → 4s, max 3 attempts.
 * Non-transient errors (validation, auth, not-found) are rethrown immediately.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (isTransientPrismaError(error) && attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

/**
 * Maps a final (post-retry) transient DB failure to a 503 response so clients
 * never read a pooler blip as an auth failure (401) or a generic 500.
 * Returns null for non-transient errors so routes keep their existing handling.
 */
export function dbErrorResponse(
  error: unknown
): NextResponse | null {
  if (!isTransientPrismaError(error)) return null;
  return NextResponse.json(
    {
      error: "SERVICE_UNAVAILABLE",
      message:
        "Database temporarily unavailable. You are still signed in — please try again.",
      retryable: true,
    },
    { status: 503 }
  );
}
