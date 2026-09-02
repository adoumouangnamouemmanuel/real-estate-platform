import { api } from "@/lib/api";
import type { ApiResponse, User, UserRole } from "@/types";

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

/**
 * Maps backend role names to frontend role names.
 * The backend uses "PROPERTY_DEVELOPER" but the frontend "UserRole" type
 * uses "DEVELOPER" — this is the single seam where the mapping lives.
 */
function mapRole(backendRole: string): UserRole {
  if (backendRole === "PROPERTY_DEVELOPER") return "DEVELOPER";
  return backendRole as UserRole;
}

function mapSession(raw: AuthSession): AuthSession {
  return { ...raw, user: { ...raw.user, role: mapRole(raw.user.role) } };
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
  }: RegisterPayload): Promise<AuthSession> =>
    api
      .post<ApiResponse<AuthSession>>("/auth/register", {
        fullName,
        email,
        password,
      })
      .then((res) => mapSession(res.data.data)),

  logout: (): Promise<void> =>
    api.post("/auth/logout").then(() => undefined),

  requestPasswordReset: (email: string): Promise<void> =>
    api
      .post("/auth/forgot-password", { email })
      .then(() => undefined),

  validateResetToken: (token: string): Promise<ValidateResetTokenResult> =>
    api
      .get<ApiResponse<ValidateResetTokenResult>>(
        `/auth/reset-password/${token}`,
      )
      .then((res) => res.data.data),

  resetPassword: ({ token, password }: ResetPasswordPayload): Promise<void> =>
    api
      .post("/auth/reset-password", { token, password })
      .then(() => undefined),
};
