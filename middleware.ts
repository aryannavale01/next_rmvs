import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function pathnameStartsWith(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

function isSafeRedirect(url: string, base: string): boolean {
  try {
    const target = new URL(url, base);
    const origin = new URL(base);
    return target.origin === origin.origin && target.pathname.startsWith("/");
  } catch {
    return false;
  }
}

/**
 * Two-layer auth defense:
 *   Layer 1 (Edge middleware): Cookie existence check + Cache-Control.
 *     Blocks unauthenticated users immediately (no DB access needed).
 *   Layer 2 (Node.js layouts): requireAuth()/requireAdmin() role verification.
 *     Blocks wrong-role users via DB session lookup.
 *
 * EDGE CONSTRAINT: Better Auth v1.6.23 has no edge-compatible session
 * verification for DB-backed sessions. auth.api.getSession() requires
 * Prisma/Node.js runtime. This middleware intentionally does ONLY cookie
 * name checking — full session validation happens in Layer 2.
 *
 * TEST NOTE: A MEMBER session cookie hitting /admin/* MUST be blocked at the
 * layout layer (Layer 2), not just in client UI. Middleware here only checks
 * cookie existence — role enforcement is in app/admin/(protected)/layout.tsx.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Prevent browser caching of all API responses (defense in depth)
  const isApiRoute = pathname.startsWith('/api/');
  if (isApiRoute) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
    return response;
  }

  const isAdminRoute = pathnameStartsWith(pathname, "/admin");
  const isDashboardRoute = pathnameStartsWith(pathname, "/dashboard");
  const isPublic =
    pathnameStartsWith(pathname, "/login") ||
    pathnameStartsWith(pathname, "/register") ||
    pathnameStartsWith(pathname, "/admin/login") ||
    pathnameStartsWith(pathname, "/unauthorized") ||
    pathnameStartsWith(pathname, "/forgot-password") ||
    pathnameStartsWith(pathname, "/reset-password") ||
    pathname === "/api/auth" ||
    pathname.startsWith("/api/auth/");

  const isProtected = (isAdminRoute || isDashboardRoute || pathnameStartsWith(pathname, "/force-password-change")) && !isPublic;

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check session cookie existence (Edge-compatible, no DB access)
  const sessionCookie =
    request.cookies.get("cg..session_token")?.value ||
    request.cookies.get("cg.session_token")?.value;

  if (!sessionCookie) {
    const loginUrl = new URL(
      isAdminRoute ? "/admin/login" : "/login",
      request.url
    );
    const redirectTo = pathname;
    if (isSafeRedirect(redirectTo, request.url)) {
      loginUrl.searchParams.set("redirectTo", redirectTo);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated — add Cache-Control to prevent browser-back content leakage
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, must-revalidate");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
