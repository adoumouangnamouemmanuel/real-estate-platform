"use client";

import { useEffect, useState } from "react";

import { authService } from "@/services";
import { useAuthStore } from "@/store/authStore";

/**
 * Restores the in-memory session from the HttpOnly refresh cookie on app load — the
 * access token itself is never persisted (docs/ARCHITECTURE.md §6), so every full
 * page load starts logged-out until this resolves.
 */
export function useAuthBootstrap() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

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
        if (!cancelled) setIsBootstrapping(false);
      });

    return () => {
      cancelled = true;
    };
  }, [setAuth]);

  return { isBootstrapping };
}
