import { NextResponse } from "next/server";
import { auth } from "./auth";
import { prisma, withRetry, isTransientPrismaError } from "./prisma";
import { STEP_UP_WINDOW_MS, getStepUpWindowMs } from "./admin-security";
import type { BA_Role } from "@prisma/client";

/**
 * Calls auth.api.getSession() with retry logic for transient connection errors.
 *
 * P1017/P1001/P2024/P2037 (pooler idle recycling, server restart, pool
 * exhaustion, network blip) are retried with exponential backoff via the
 * shared withRetry() helper. Non-connection errors (expired token, malformed
 * cookie) are thrown immediately — no retry.
 */
async function getSessionWithRetry(headers: Headers) {
  return withRetry(() => auth.api.getSession({ headers }));
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
  } catch (error) {
    // A transient DB/pooler failure is NOT a logout. Distinguish it so callers
    // can return 503 ("still signed in, try again") instead of a 401 that the
    // client would read as "you've been logged out". Real auth failures
    // (expired/invalid session) still map to Unauthorized.
    if (isTransientPrismaError(error)) {
      return { success: false, error: "DATABASE_UNAVAILABLE" };
    }
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
 * Verify the request has a valid session with MEMBER role.
 *
 * Use this to gate member-only areas (e.g. the member dashboard) so an ADMIN
 * session cannot access them.
 */
export async function requireMember(headers?: Headers): Promise<AuthResult> {
  const result = await requireAuth(headers);

  if (!result.success) {
    return result;
  }

  if (result.session.user.role !== "MEMBER") {
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

  try {
    const [session, stepUpWindowMs] = await Promise.all([
      prisma.session.findUnique({
        where: { id: result.session.session.id },
        select: { stepUpVerifiedAt: true },
      }),
      getStepUpWindowMs(),
    ]);

    if (
      !session?.stepUpVerifiedAt ||
      Date.now() - session.stepUpVerifiedAt.getTime() > stepUpWindowMs
    ) {
      return { success: false, error: "STEP_UP_REQUIRED" };
    }
  } catch (error) {
    // A DB blip while reading step-up state is not an auth failure — surface
    // it as a retryable service error rather than a confusing 401/500.
    if (isTransientPrismaError(error)) {
      return { success: false, error: "DATABASE_UNAVAILABLE" };
    }
    throw error;
  }

  return result;
}

/**
 * Verify the request has a valid ADMIN session with recent OTP verification.
 *
 * This gates the /admin area: an administrator must complete the email OTP
 * challenge shortly after signing in. It reuses the same session marker
 * (stepUpVerifiedAt) as the sensitive-action step-up flow, so a completed OTP
 * also satisfies requireStepUp and vice-versa.
 */
export async function requireOtpVerified(headers?: Headers): Promise<AuthResult> {
  const result = await requireAdmin(headers);

  if (!result.success) {
    return result;
  }

  try {
    const [session, stepUpWindowMs] = await Promise.all([
      prisma.session.findUnique({
        where: { id: result.session.session.id },
        select: { stepUpVerifiedAt: true },
      }),
      getStepUpWindowMs(),
    ]);

    if (
      !session?.stepUpVerifiedAt ||
      Date.now() - session.stepUpVerifiedAt.getTime() > stepUpWindowMs
    ) {
      return { success: false, error: "OTP_REQUIRED" };
    }
  } catch (error) {
    if (isTransientPrismaError(error)) {
      return { success: false, error: "DATABASE_UNAVAILABLE" };
    }
    throw error;
  }

  return result;
}

/**
 * Convert a failed step-up guard into an HTTP response for API routes.
 * Returns null when the guard passed so the route can proceed.
 *
 * STEP_UP_REQUIRED -> 403 { error: 'STEP_UP_REQUIRED' } so clients can detect
 * the exact condition and redirect to the verify-stepup flow.
 * DATABASE_UNAVAILABLE -> 503 { error: 'SERVICE_UNAVAILABLE' } so a transient
 * pooler blip is never read by the client as "logged out" (a 401).
 * Forbidden -> 403. Any other failure keeps the route's existing 401 semantics.
 *
 * Usage in API Routes:
 *   const auth = await requireStepUp();
 *   const resp = stepUpErrorResponse(auth);
 *   if (resp) return resp;
 */
export function stepUpErrorResponse(
  auth: AuthResult
): NextResponse | null {
  if (auth.success) {
    return null;
  }

  if (auth.error === "STEP_UP_REQUIRED") {
    return NextResponse.json(
      {
        error: "STEP_UP_REQUIRED",
        message:
          "This action requires recent authentication. Please verify your password.",
      },
      { status: 403 }
    );
  }

  if (auth.error === "DATABASE_UNAVAILABLE") {
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

  if (auth.error === "Forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Generic auth-guard response mapper for requireAuth()/requireAdmin() callers.
 * Same contract as stepUpErrorResponse(); use it in routes that gate with
 * requireAdmin()/requireAuth() rather than requireStepUp().
 */
export const authErrorResponse = stepUpErrorResponse;
