import { PrismaClient } from "@prisma/client";

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
 * Wraps a Prisma query with retry logic for pool-exhaustion errors (P2024).
 * Uses exponential backoff: 1s → 2s → 4s, max 3 attempts.
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

      // Only retry on P2024 (connection pool timeout) or P2037 (too many connections)
      if (
        error instanceof Error &&
        'code' in error &&
        ((error as { code: string }).code === "P2024" || (error as { code: string }).code === "P2037") &&
        attempt < maxAttempts
      ) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}
