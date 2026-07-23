import { Prisma } from "@prisma/client";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { STEP_UP_WINDOW_MS } from "./admin-security";
import type { BA_Role } from "@prisma/client";

// Prisma error codes that indicate transient connection issues (pooler idle
// recycling, server restart, network blip). These are safe to retry because
// the next attempt usually gets a fresh connection from the pool.
const TRANSIENT_ERROR_CODES = new Set(["P1017", "P1001", "P2024"]);

// Backoff delays in ms for retry attempts 2 and 3.
const RETRY_DELAYS = [250, 500];

function isTransientConnectionError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    TRANSIENT_ERROR_CODES.has(error.code)
  );
}

/**
 * Calls auth.api.getSession() with retry logic for transient connection errors.
 *
 * P1017 ("Server has closed the connection") fires when the pooler recycles an
 * idle connection that Prisma still holds. A short wait + retry gets a fresh
 * connection and succeeds. Non-connection errors (expired token, malformed
 * cookie) are thrown immediately — no retry.
 */
async function getSessionWithRetry(headers: Headers) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 1 + RETRY_DELAYS.length; attempt++) {
    try {
      return await auth.api.getSession({ headers });
    } catch (error) {
      lastError = error;

      if (
        isTransientConnectionError(error) &&
        attempt <= RETRY_DELAYS.length
      ) {
        const delay = RETRY_DELAYS[attempt - 1];
        console.warn(
          `[session] Transient connection error (attempt ${attempt}/${1 + RETRY_DELAYS.length}): ` +
            `${(error as { code: string }).code}. Retrying in ${delay}ms…`
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role?: BA_Role;
};

export type Session = {
  user: SessionUser;
  session: { id: string; expiresAt: Date };
};

export type AuthResult =
  | { success: true; session: Session }
  | { success: false; error: string };

/**
 * Verify the request has a valid authenticated session.
 *
 * Usage in Server Actions:
 *   const auth = await requireAuth();
 *   if (!auth.success) return auth.error;
 *   const { user } = auth.session;
 *
 * Usage in API Routes:
 *   import { headers } from "next/headers";
 *   const auth = await requireAuth(await headers());
 */
export async function requireAuth(headers?: Headers): Promise<AuthResult> {
  try {
    if (!headers) {
      const { headers: nextHeaders } = await import("next/headers");
      headers = await nextHeaders();
    }

    const session = await getSessionWithRetry(headers);

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    return {
      success: true,
      session: {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: (session.user as unknown as { role?: BA_Role }).role,
        },
        session: {
          id: session.session.id,
          expiresAt: session.session.expiresAt,
        },
      },
    };
  } catch {
    return { success: false, error: "Unauthorized" };
  }
}

/**
 * Verify the request has a valid session with ADMIN role.
 *
 * Usage in Server Actions:
 *   const auth = await requireAdmin();
 *   if (!auth.success) return auth.error;
 *   const { user } = auth.session;
 *
 * Usage in API Routes:
 *   import { headers } from "next/headers";
 *   const auth = await requireAdmin(await headers());
 */
export async function requireAdmin(headers?: Headers): Promise<AuthResult> {
  const result = await requireAuth(headers);

  if (!result.success) {
    return result;
  }

  if (result.session.user.role !== "ADMIN") {
    return { success: false, error: "Forbidden" };
  }

  return result;
}

/**
 * Verify the request has a valid ADMIN session with recent step-up verification.
 *
 * Use this for sensitive admin actions (role changes, deletions, settings changes).
 * If stepUpVerifiedAt is null or older than STEP_UP_WINDOW_MS, returns STEP_UP_REQUIRED.
 */
export async function requireStepUp(headers?: Headers): Promise<AuthResult> {
  const result = await requireAdmin(headers);

  if (!result.success) {
    return result;
  }

  const session = await prisma.session.findUnique({
    where: { id: result.session.session.id },
    select: { stepUpVerifiedAt: true },
  });

  if (
    !session?.stepUpVerifiedAt ||
    Date.now() - session.stepUpVerifiedAt.getTime() > STEP_UP_WINDOW_MS
  ) {
    return { success: false, error: "STEP_UP_REQUIRED" };
  }

  return result;
}
