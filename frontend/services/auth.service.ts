import { api } from "@/lib/api";
import {
  clearMockSessionCookie,
  setMockSessionCookie,
} from "@/lib/mockSessionCookie";
import { MOCK_ACCOUNTS, MOCK_RESET_TOKENS } from "@/services/mocks/auth.mock";
import type { ApiResponse, User } from "@/types";

export interface AuthSession {
  user: User;
  accessToken: string;
}

const MOCK_LATENCY_MS = 400;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(value), MOCK_LATENCY_MS),
  );
}

function fail(message: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), MOCK_LATENCY_MS),
  );
}

function buildMockAccessToken(user: User): string {
  return `mock.${user.id}.${Date.now()}`;
}

function findAccount(email: string) {
  return MOCK_ACCOUNTS.find(
    (account) => account.user.email.toLowerCase() === email.toLowerCase(),
  );
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
      .then((response) => response.data.data),

  // TODO(backend): replace with POST /api/v1/auth/login once the endpoint exists.
  login: ({ email, password }: LoginPayload): Promise<AuthSession> => {
    const account = findAccount(email);

    // Same message whether the email doesn't exist or the password is wrong — a login
    // failure must never disclose which one it was (OWASP: prevents user enumeration).
    if (!account || account.password !== password) {
      return fail("Invalid email or password.");
    }

    setMockSessionCookie();

    return delay({
      user: account.user,
      accessToken: buildMockAccessToken(account.user),
    });
  },

  // TODO(backend): replace with POST /api/v1/auth/register once the endpoint exists.
  // Public registration only ever creates a USER account — becoming a verified
  // DEVELOPER is a trust feature handled separately (see docs/ARCHITECTURE.md §1).
  register: ({
    fullName,
    email,
    password,
  }: RegisterPayload): Promise<AuthSession> => {
    if (findAccount(email)) {
      return fail("An account with this email already exists.");
    }

    const user: User = {
      id: `u${MOCK_ACCOUNTS.length + 1}`,
      fullName,
      email,
      role: "USER",
    };
    MOCK_ACCOUNTS.push({ user, password });
    setMockSessionCookie();

    return delay({ user, accessToken: buildMockAccessToken(user) });
  },

  // TODO(backend): replace with POST /api/v1/auth/logout (clears the refresh cookie server-side).
  logout: (): Promise<void> => {
    clearMockSessionCookie();
    return delay(undefined);
  },

  // TODO(backend): replace with POST /api/v1/auth/forgot-password once the endpoint exists.
  // Always resolves the same way regardless of whether the email matches an account —
  // the deliberate anti-enumeration pattern for password reset flows specifically (OWASP).
  requestPasswordReset: (email: string): Promise<void> => {
    const account = findAccount(email);

    if (account) {
      const token = `mock-reset-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      MOCK_RESET_TOKENS.set(token, {
        email: account.user.email,
        expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
      });
    }

    return delay(undefined);
  },

  // TODO(backend): replace with a real token-validation endpoint.
  validateResetToken: (token: string): Promise<ValidateResetTokenResult> => {
    const entry = MOCK_RESET_TOKENS.get(token);

    if (!entry) return delay({ valid: false, expired: false });
    if (entry.expiresAt < Date.now())
      return delay({ valid: false, expired: true });

    return delay({ valid: true, expired: false });
  },

  // TODO(backend): replace with POST /api/v1/auth/reset-password once the endpoint exists.
  resetPassword: ({ token, password }: ResetPasswordPayload): Promise<void> => {
    const entry = MOCK_RESET_TOKENS.get(token);

    if (!entry || entry.expiresAt < Date.now()) {
      return fail("This reset link is invalid or has expired.");
    }

    const account = findAccount(entry.email);
    if (account) account.password = password;
    MOCK_RESET_TOKENS.delete(token);

    return delay(undefined);
  },
};
