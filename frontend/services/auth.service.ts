import { api } from "@/lib/api";
import type { ApiResponse, User } from "@/types";

export interface AuthSession {
  user: User;
  accessToken: string;
}

/** Auth API calls. Encapsulates the request/response shape so callers never touch Axios directly. */
export const authService = {
  /** Exchanges the HttpOnly refresh cookie for a new access token — see docs/ARCHITECTURE.md §6. */
  refresh: () =>
    api
      .post<ApiResponse<AuthSession>>("/auth/refresh")
      .then((response) => response.data.data),
};
