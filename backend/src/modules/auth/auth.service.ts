import crypto from "node:crypto";
import { databaseContext, prisma } from "../../config/prisma.js";
import { getSupabase } from "../../config/supabase.js";
import { getEnv } from "../../config/env.js";
import {
  UnauthorizedError,
  BadRequestError,
  ApiError,
} from "../../utils/errors.js";
import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "./auth.schema.js";
import type { Session, User as AuthUser } from "@supabase/supabase-js";

export interface AuthSession {
  user: {
    id: string;
    fullName: string | null;
    email: string;
    role: string;
    developerId?: string;
  };
  accessToken: string;
}
async function mapSession(session: Session, authUser: AuthUser) {
  if (!authUser.email_confirmed_at || !authUser.email)
    throw new UnauthorizedError("Confirm your email before signing in");
  const context = databaseContext.getStore();
  if (!context) throw new Error("Missing request context");
  context.actor = { authUserId: authUser.id };
  const select = {
    id: true,
    email: true,
    fullName: true,
    role: true,
    developerProfile: {
      select: { id: true, sellerStatus: true, deletedAt: true },
    },
  } as const;
  let user = await prisma.user.findUnique({
    where: { authUserId: authUser.id },
    select,
  });
  if (!user) {
    try {
      user = await prisma.user.create({
        data: {
          authUserId: authUser.id,
          email: authUser.email.toLowerCase(),
          role: "USER",
          fullName:
            typeof authUser.user_metadata?.full_name === "string"
              ? authUser.user_metadata.full_name.slice(0, 100)
              : null,
          // Retain the legacy NOT NULL column without a usable legacy password.
          passwordHash:
            "managed-auth:" + crypto.randomBytes(32).toString("hex"),
        },
        select,
      });
    } catch {
      throw new UnauthorizedError(
        "Existing account requires verified identity mapping",
      );
    }
  }
  const developerId =
    user.role === "PROPERTY_DEVELOPER" &&
    user.developerProfile?.sellerStatus === "ACTIVE" &&
    !user.developerProfile.deletedAt
      ? user.developerProfile.id
      : undefined;
  context.actor = {
    authUserId: authUser.id,
    userId: user.id,
    role: user.role,
    developerId,
  };
  return {
    session: {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        developerId,
      },
      accessToken: session.access_token,
    },
    refreshToken: session.refresh_token,
    expiresAt: new Date(
      Date.now() + getEnv().REFRESH_TOKEN_EXPIRES_IN_DAYS * 86400000,
    ),
  };
}
export async function login(
  input: LoginInput,
  _userAgent?: string,
  _ip?: string,
) {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error || !data.session || !data.user)
    throw new UnauthorizedError("Invalid email or password");
  return mapSession(data.session, data.user);
}
export async function register(
  input: RegisterInput,
  _userAgent?: string,
  _ip?: string,
) {
  // Registration never grants a seller/admin role; editable metadata is profile text only.
  const { data, error } = await getSupabase().auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { full_name: input.fullName },
      emailRedirectTo: getEnv().CORS_ORIGIN + "/login?confirmed=1",
    },
  });
  if (error)
    throw new BadRequestError(
      "Unable to register account",
      "REGISTRATION_FAILED",
    );
  if (!data.session || !data.user?.email_confirmed_at)
    return { requiresEmailConfirmation: true as const };
  return mapSession(data.session, data.user);
}
export async function refresh(
  token: string,
  _userAgent?: string,
  _ip?: string,
) {
  const { data, error } = await getSupabase().auth.refreshSession({
    refresh_token: token,
  });
  if (error || !data.session || !data.user)
    throw new UnauthorizedError("Invalid or expired refresh session");
  return mapSession(data.session, data.user);
}
export async function logout(accessToken: string, refreshToken: string) {
  const client = getSupabase();
  const { error } = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw new UnauthorizedError("Session could not be revoked");
  const signedOut = await client.auth.signOut({ scope: "global" });
  if (signedOut.error)
    throw new ApiError(
      503,
      "Session revocation is temporarily unavailable",
      "SESSION_REVOCATION_FAILED",
    );
}
export async function forgotPassword(input: ForgotPasswordInput) {
  const { error } = await getSupabase().auth.resetPasswordForEmail(
    input.email,
    { redirectTo: getEnv().AUTH_REDIRECT_URL },
  );
  // Same response for existing/unknown accounts. Never log identifiers or tokens.
  if (error && error.status && error.status >= 500)
    throw new BadRequestError(
      "Recovery is temporarily unavailable",
      "RECOVERY_UNAVAILABLE",
    );
}
export async function resetPassword(input: ResetPasswordInput) {
  const client = getSupabase();
  const { data, error } = await client.auth.verifyOtp({
    token_hash: input.token,
    type: "recovery",
  });
  if (error || !data.session)
    throw new BadRequestError(
      "This reset link is invalid or expired",
      "INVALID_TOKEN",
    );
  const updated = await client.auth.updateUser({ password: input.password });
  if (updated.error)
    throw new BadRequestError(
      "Password could not be updated",
      "PASSWORD_UPDATE_FAILED",
    );
  const signedOut = await client.auth.signOut({ scope: "global" });
  if (signedOut.error)
    throw new ApiError(
      503,
      "Password updated but session revocation failed",
      "SESSION_REVOCATION_FAILED",
    );
}
export async function validateResetToken(_token: string): Promise<never> {
  throw new BadRequestError(
    "Submit the recovery token in the reset form",
    "RECOVERY_TOKEN_CHECK_REMOVED",
  );
}
