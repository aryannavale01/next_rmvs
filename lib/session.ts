import { auth } from "./auth";
import { prisma } from "./prisma";
import { STEP_UP_WINDOW_MS } from "./admin-security";
import type { BA_Role } from "@prisma/client";

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

    const session = await auth.api.getSession({
      headers,
    });

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
