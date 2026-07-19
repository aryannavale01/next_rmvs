import { auth } from "./auth";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role?: string;
};

type Session = {
  user: SessionUser;
  session: { id: string; expiresAt: Date };
};

type AuthResult =
  | { success: true; session: Session }
  | { success: false; error: string };

/**
 * Verify the request has a valid authenticated session.
 * Returns the session or an error response.
 *
 * Usage in Server Actions:
 *   const auth = await requireAuth();
 *   if (!auth.success) return auth.error;
 *   const { user } = auth.session;
 */
export async function requireAuth(): Promise<AuthResult> {
  try {
    const session = await auth.api.getSession({
      headers: new Headers(),
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
          role: (session.user as Record<string, unknown>).role as string | undefined,
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
 * Returns the session or an error response.
 *
 * Usage in Server Actions:
 *   const auth = await requireAdmin();
 *   if (!auth.success) return auth.error;
 *   const { user } = auth.session;
 */
export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireAuth();

  if (!result.success) {
    return result;
  }

  if (result.session.user.role !== "ADMIN") {
    return { success: false, error: "Forbidden" };
  }

  return result;
}
