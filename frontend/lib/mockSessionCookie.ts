import { AUTH_COOKIE_NAME } from "@/constants/config";

const MOCK_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days, matching the real refresh token's documented lifetime.

/**
 * TODO(backend): delete this file once the real backend issues the actual HttpOnly
 * refresh-token cookie on login/register.
 *
 * proxy.ts (docs/ARCHITECTURE.md §6) gates /dashboard and /admin on AUTH_COOKIE_NAME's
 * presence, and that gate runs on every navigation — including the client-side redirect
 * immediately after a successful mock login, not just full page loads. A real backend
 * sets that cookie itself (HttpOnly, Secure, SameSite=Strict) as part of the login
 * response; services/mocks/auth.mock.ts has no server response to piggyback on, so
 * without this, a developer could never actually reach the dashboard they just logged
 * into. This sets a non-HttpOnly marker cookie carrying no auth power of its own — it
 * only satisfies proxy.ts's presence check. The real access token never leaves the
 * in-memory Zustand store (see docs/ARCHITECTURE.md §6's token strategy); nothing
 * sensitive is written here.
 */
export function setMockSessionCookie(): void {
  if (typeof document === "undefined") return;

  document.cookie = `${AUTH_COOKIE_NAME}=mock-session; path=/; max-age=${MOCK_SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearMockSessionCookie(): void {
  if (typeof document === "undefined") return;

  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
