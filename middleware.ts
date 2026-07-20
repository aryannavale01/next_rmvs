import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function pathnameStartsWith(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("session_token")?.value;
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathnameStartsWith(pathname, "/admin");
  const isDashboardRoute = pathnameStartsWith(pathname, "/dashboard");
  const isPublic =
    pathnameStartsWith(pathname, "/login") ||
    pathnameStartsWith(pathname, "/register") ||
    pathnameStartsWith(pathname, "/admin/login") ||
    pathnameStartsWith(pathname, "/api/mock-login") ||
    pathnameStartsWith(pathname, "/api/mock-logout");

  const isProtected = (isAdminRoute || isDashboardRoute) && !isPublic;

  if (isProtected && !sessionToken) {
    const loginPage = isAdminRoute ? "/admin/login" : "/login";
    const loginUrl = new URL(loginPage, request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (sessionToken) {
    if (
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/admin/login"
    ) {
      const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/";
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
