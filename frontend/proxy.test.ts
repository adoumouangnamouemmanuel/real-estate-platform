import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { AUTH_COOKIE_NAME } from "@/constants/config";

import { proxy } from "./proxy";

/**
 * proxy.ts is a coarse, cookie-presence-only gate for /dashboard and /admin —
 * it cannot safely check *role* without a real, signed backend token to
 * decode (the mock session cookie is an unsigned presence marker, not a
 * verifiable claim — see lib/mockSessionCookie.ts). The actual role check for
 * /admin lives client-side in RequireAuth (see RequireAuth.test.tsx's
 * "super-admin route protection" cases) with the real, authoritative
 * enforcement deferred to the backend, per docs/ARCHITECTURE.md §6. These
 * tests cover exactly what proxy.ts is responsible for: redirecting away
 * from /dashboard and /admin when there's no session at all.
 */
describe("proxy", () => {
  it("redirects to /login when there is no session cookie on a /dashboard route", () => {
    const request = new NextRequest("https://example.com/dashboard");
    const response = proxy(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("redirect")).toBe("/dashboard");
  });

  it("redirects to /login when there is no session cookie on an /admin route", () => {
    const request = new NextRequest("https://example.com/admin");
    const response = proxy(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("redirect")).toBe("/admin");
  });

  it("allows the request through when a session cookie is present", () => {
    const request = new NextRequest("https://example.com/admin", {
      headers: { cookie: `${AUTH_COOKIE_NAME}=mock-session` },
    });
    const response = proxy(request);

    // NextResponse.next() carries no redirect Location header — this is the
    // "let it through" branch, not an assertion that the requester is
    // actually authorized for /admin specifically (that's RequireAuth's job).
    expect(response.headers.get("location")).toBeNull();
  });
});
