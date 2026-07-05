"use client";

import { useAuthStore } from "@/store/authStore";

/** Thin, component-facing wrapper over the auth store. */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return { user, isAuthenticated, setAuth, clearAuth };
}
