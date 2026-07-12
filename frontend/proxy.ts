import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/constants/config";
import { ROUTES } from "@/constants/routes";

/**
 * Coarse session gate for the (dashboard) and (admin) route groups: redirects to
 * login when the refresh cookie is missing. This is UX-layer defense in depth —
 * role checks (DEVELOPER vs ADMIN) and the real authorization boundary live
 * server-side, per docs/ARCHITECTURE.md §6.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(AUTH_COOKIE_NAME)) {
    return NextResponse.next();
  }

  const loginUrl = new URL(ROUTES.LOGIN, request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
