"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Loading } from "@/components/common/Loading";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types";

interface RequireAuthProps {
  children: React.ReactNode;
  /** Minimum role required, per the inheritance model in docs/ARCHITECTURE.md §6 (ADMIN > DEVELOPER > USER). */
  role?: UserRole;
}

const ROLE_RANK: Record<UserRole, number> = { USER: 0, DEVELOPER: 1, ADMIN: 2 };

function hasRequiredRole(
  userRole: UserRole | undefined,
  requiredRole: UserRole,
) {
  return (
    userRole !== undefined && ROLE_RANK[userRole] >= ROLE_RANK[requiredRole]
  );
}

/**
 * Client-side defense-in-depth for (dashboard)/(admin) layouts. proxy.ts already gates on
 * the refresh cookie's presence server-side (redirecting straight to /login); this catches
 * what proxy.ts can't see — bootstrap resolving to "not authenticated" (cookie invalid or
 * expired) or an authenticated user whose role doesn't satisfy the route — and shows an
 * explicit page instead of either a redirect loop or silently rendering protected content.
 *
 * Reads isBootstrapping from the store rather than calling useAuthBootstrap() again —
 * that hook already runs exactly once, in app/providers.tsx; calling it a second time here
 * would fire a second, redundant session-restore request.
 */
export function RequireAuth({ children, role }: RequireAuthProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

  const isForbidden =
    isAuthenticated && !!role && !hasRequiredRole(user?.role, role);

  useEffect(() => {
    if (isBootstrapping) return;

    if (!isAuthenticated) {
      router.replace(ROUTES.UNAUTHORIZED);
    } else if (isForbidden) {
      router.replace(ROUTES.FORBIDDEN);
    }
  }, [isBootstrapping, isAuthenticated, isForbidden, router]);

  if (isBootstrapping || !isAuthenticated || isForbidden) {
    return <Loading />;
  }

  return children;
}
