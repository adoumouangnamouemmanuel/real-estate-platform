import { prisma } from "../../config/prisma.js";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeAllRefreshTokens,
} from "../../utils/auth.js";
import {
  UnauthorizedError,
  BadRequestError,
  ConflictError,
} from "../../utils/errors.js";
import type { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput } from "./auth.schema.js";
import crypto from "node:crypto";

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

export async function login(
  input: LoginInput,
  userAgent?: string,
  ipAddress?: string,
): Promise<{ session: AuthSession; refreshToken: string; expiresAt: Date }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const validPassword = await comparePassword(input.password, user.passwordHash);
  if (!validPassword) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const devProfile = await prisma.propertyDeveloper.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
    developerId: devProfile?.id,
  });

  const { rawToken, expiresAt } = await createRefreshToken(user.id, userAgent, ipAddress);

  return {
    session: {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        developerId: devProfile?.id,
      },
      accessToken,
    },
    refreshToken: rawToken,
    expiresAt,
  };
}

export async function register(
  input: RegisterInput,
  userAgent?: string,
  ipAddress?: string,
): Promise<{ session: AuthSession; refreshToken: string; expiresAt: Date }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      role: input.role as "USER" | "PROPERTY_DEVELOPER",
    },
  });

  const devProfile = await prisma.propertyDeveloper.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
    developerId: devProfile?.id,
  });

  const { rawToken, expiresAt } = await createRefreshToken(user.id, userAgent, ipAddress);

  return {
    session: {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        developerId: devProfile?.id,
      },
      accessToken,
    },
    refreshToken: rawToken,
    expiresAt,
  };
}

export async function refresh(
  rawRefreshToken: string,
  userAgent?: string,
  ipAddress?: string,
): Promise<{ session: AuthSession; refreshToken: string; expiresAt: Date }> {
  const tokenRecord = await validateRefreshToken(rawRefreshToken);

  if (!tokenRecord) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: tokenRecord.userId } });
  if (!user) {
    throw new UnauthorizedError("User no longer exists");
  }

  const devProfile = await prisma.propertyDeveloper.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  const { rawToken: newRawToken, expiresAt } = await rotateRefreshToken(
    rawRefreshToken,
    user.id,
    userAgent,
    ipAddress,
  );

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
    developerId: devProfile?.id,
  });

  return {
    session: {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        developerId: devProfile?.id,
      },
      accessToken,
    },
    refreshToken: newRawToken,
    expiresAt,
  };
}

export async function logout(userId: string): Promise<void> {
  await revokeAllRefreshTokens(userId);
}

// ─────────────────────────────────────────────
// Forgot Password — always returns 200 (anti-enumeration)
// ─────────────────────────────────────────────

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
const resetTokens = new Map<string, { email: string; expiresAt: number }>();

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  // Always succeeds — never reveals whether the email exists
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    resetTokens.set(token, { email: user.email, expiresAt: Date.now() + RESET_TOKEN_TTL_MS });
    // In production: send email with reset link containing this token
    console.log(`[DEV] Password reset token for ${user.email}: ${token}`);
  }
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const entry = resetTokens.get(input.token);
  if (!entry || entry.expiresAt < Date.now()) {
    throw new BadRequestError("This reset link is invalid or has expired.", "INVALID_TOKEN");
  }

  const passwordHash = await hashPassword(input.password);
  await prisma.user.update({ where: { email: entry.email }, data: { passwordHash } });
  resetTokens.delete(input.token);
}

export async function validateResetToken(token: string): Promise<{ valid: boolean; expired: boolean }> {
  const entry = resetTokens.get(token);
  if (!entry) return { valid: false, expired: false };
  if (entry.expiresAt < Date.now()) return { valid: false, expired: true };
  return { valid: true, expired: false };
}

async function validateRefreshToken(rawToken: string) {
  const { validateRefreshToken: validate } = await import("../../utils/auth.js");
  return validate(rawToken);
}
