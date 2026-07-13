import { ROUTES } from "@/constants/routes";
import type { User } from "@/types";

/** Where a signed-in user lands: developers/admins go to the dashboard, everyone else home. */
export function getPostLoginDestination(user: User): string {
  return user.role === "DEVELOPER" || user.role === "ADMIN"
    ? ROUTES.DASHBOARD
    : ROUTES.HOME;
}

/**
 * Guards against unvalidated open redirects (OWASP): proxy.ts's `?redirect=` param is
 * attacker-controllable (anyone can craft `/login?redirect=https://evil.example`), so it
 * must never be used verbatim. Only a same-origin relative path is honored.
 */
export function getSafeRedirectPath(
  path: string | undefined | null,
): string | undefined {
  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.startsWith("/\\")
  ) {
    return undefined;
  }

  return path;
}
