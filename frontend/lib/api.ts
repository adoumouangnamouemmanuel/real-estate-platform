import axios, { AxiosError } from "axios";

import { API_BASE_URL } from "@/constants/config";
import { useAuthStore } from "@/store/authStore";
import type { ApiResponse } from "@/types";
import type { AuthSession } from "@/services/auth.service";

/** Configured Axios instance for all backend API calls. */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retried?: boolean;
  }
}

/**
 * Calls /auth/refresh directly via a bare axios instance rather than importing
 * authService — authService imports `api` from this file, so importing it back here
 * would be circular. Kept deliberately minimal (this one request only).
 */
function refreshAccessToken(): Promise<string> {
  return axios
    .post<ApiResponse<AuthSession>>(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    )
    .then((response) => {
      const session = response.data.data;
      useAuthStore.getState().setAuth(session.user, session.accessToken);
      return session.accessToken;
    });
}

// Silent-refresh-and-retry: an access token expires (15min) well before the refresh
// cookie (7 days) — see docs/ARCHITECTURE.md §6. A request that 401s because the token
// expired mid-session gets one retry after a fresh token, instead of surfacing a
// spurious error or forcing the user to manually reload.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retried
    ) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    try {
      const accessToken = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(refreshError);
    }
  },
);
