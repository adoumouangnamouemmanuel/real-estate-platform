import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/constants/config";
import { ROUTES } from "@/constants/routes";

/**
 * Coarse session gate for the (dashboard) and (admin) route groups: redirects to
 * login when the refresh cookie is missing. This is UX-layer defense in depth —
 * role checks (DEVELOPER vs ADMIN/Super Admin) and the real authorization
 * boundary live server-side, per docs/ARCHITECTURE.md §6.
 *
 * Deliberately does NOT check role here, even for /admin: the mock session
 * cookie (lib/mockSessionCookie.ts) is an unsigned presence marker, not a
 * verifiable claim — trusting a role value read from it would be inventing a
 * JWT claim this environment doesn't actually have. The real, safe role check
 * happens client-side in RequireAuth (components/auth/RequireAuth.tsx, which
 * (admin)/layout.tsx wraps every admin route in with `role="ADMIN"`), backed
 * by whatever the mock/real auth session actually resolved to — and even that
 * is UX-layer only. **The real Super Admin authorization boundary is the
 * backend's job**: it must independently re-verify role on every request to
 * an admin-scoped endpoint, never trust a cookie's mere presence or a
 * client-reported role.
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
