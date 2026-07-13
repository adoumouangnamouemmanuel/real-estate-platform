import { create } from "zustand";

import type { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** True until the one-time session-restore call (useAuthBootstrap) resolves. */
  isBootstrapping: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  setBootstrapped: () => void;
}

/** Access token lives in memory only — never persisted, per the token strategy in docs/ARCHITECTURE.md. */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isBootstrapping: true,
  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true }),
  clearAuth: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),
  setBootstrapped: () => set({ isBootstrapping: false }),
}));
