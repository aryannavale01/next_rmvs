import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function pathnameStartsWith(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathnameStartsWith(pathname, "/admin");
  const isDashboardRoute = pathnameStartsWith(pathname, "/dashboard");
  const isPublic =
    pathnameStartsWith(pathname, "/login") ||
    pathnameStartsWith(pathname, "/register") ||
    pathnameStartsWith(pathname, "/admin/login") ||
    pathnameStartsWith(pathname, "/api/auth");

  const isProtected = (isAdminRoute || isDashboardRoute) && !isPublic;

  if (!isProtected) {
    return NextResponse.next();
  }

  // Forward cookies to Better Auth for session verification
  const cookieHeader = request.headers.get("cookie") || "";
  const headers = new Headers();
  headers.set("cookie", cookieHeader);

  // Better Auth sets cookies with format: {prefix}.session_token
  // Our prefix is "cg." resulting in "cg..session_token"
  const sessionCookie =
    request.cookies.get("cg..session_token")?.value ||
    request.cookies.get("cg.session_token")?.value;

  // For admin routes, check admin session cookie
  if (isAdminRoute) {
    if (!sessionCookie) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // For dashboard routes, check session cookie
  if (isDashboardRoute) {
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
