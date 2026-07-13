"use client";

import { useEffect } from "react";

import { authService } from "@/services";
import { useAuthStore } from "@/store/authStore";

/**
 * Restores the in-memory session from the HttpOnly refresh cookie on app load — the
 * access token itself is never persisted (docs/ARCHITECTURE.md §6), so every full
 * page load starts logged-out until this resolves. Called exactly once, from
 * app/providers.tsx; result lives in the store (`isBootstrapping`) so other
 * components (RequireAuth, Navbar) can read it without re-triggering the fetch.
 */
export function useAuthBootstrap() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const setBootstrapped = useAuthStore((state) => state.setBootstrapped);

  useEffect(() => {
    let cancelled = false;

    authService
      .refresh()
      .then((session) => {
        if (!cancelled) setAuth(session.user, session.accessToken);
      })
      .catch(() => {
        // No valid refresh cookie — expected for anonymous visitors, not an error to surface.
      })
      .finally(() => {
        if (!cancelled) setBootstrapped();
      });

    return () => {
      cancelled = true;
    };
  }, [setAuth, setBootstrapped]);
}
