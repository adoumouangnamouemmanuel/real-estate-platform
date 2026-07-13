"use client";

import { useCallback } from "react";

import { authService } from "@/services";
import { useAuthStore } from "@/store/authStore";

/** Thin, component-facing wrapper over the auth store. */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // Clear client state even if the request fails — an unreachable logout
      // endpoint shouldn't trap the user in an apparently-logged-in state.
      clearAuth();
    }
  }, [clearAuth]);

  return { user, isAuthenticated, isBootstrapping, setAuth, clearAuth, logout };
}
