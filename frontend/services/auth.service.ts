import { mapSession } from "@/lib/authSession";
import { api } from "@/lib/api";
import type { ApiResponse, User } from "@/types";

export interface AuthSession {
  user: User;
  accessToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface ValidateResetTokenResult {
  valid: boolean;
  expired: boolean;
}

/** Auth API calls. Encapsulates the request/response shape so callers never touch Axios directly. */
export const authService = {
  /** Exchanges the HttpOnly refresh cookie for a new access token — see docs/ARCHITECTURE.md §6. */
  refresh: () =>
    api
      .post<ApiResponse<AuthSession>>("/auth/refresh")
      .then((response) => mapSession(response.data.data)),

  login: ({ email, password }: LoginPayload): Promise<AuthSession> =>
    api
      .post<ApiResponse<AuthSession>>("/auth/login", { email, password })
      .then((res) => mapSession(res.data.data)),

  register: ({
    fullName,
    email,
    password,
  }: RegisterPayload): Promise<
    AuthSession | { requiresEmailConfirmation: true }
  > =>
    api
      .post<ApiResponse<AuthSession | { requiresEmailConfirmation: true }>>(
        "/auth/register",
        {
          fullName,
          email,
          password,
        },
      )
      .then((res) =>
        "requiresEmailConfirmation" in res.data.data
          ? res.data.data
          : mapSession(res.data.data),
      ),

  logout: (): Promise<void> => api.post("/auth/logout").then(() => undefined),

  requestPasswordReset: (email: string): Promise<void> =>
    api.post("/auth/forgot-password", { email }).then(() => undefined),

  validateResetToken: (_token: string): Promise<ValidateResetTokenResult> => {
    void _token;
    return Promise.reject(
      new Error(
        "Recovery tokens are verified when the reset form is submitted",
      ),
    );
  },

  resetPassword: ({ token, password }: ResetPasswordPayload): Promise<void> =>
    api.post("/auth/reset-password", { token, password }).then(() => undefined),
};
