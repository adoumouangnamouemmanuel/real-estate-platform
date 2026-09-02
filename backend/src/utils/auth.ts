import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { prisma } from "../config/prisma.js";
import { getEnv } from "../config/env.js";
import type { JwtPayload } from "../types/index.js";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  const env = getEnv();
  return jwt.sign(payload as object, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  const env = getEnv();
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export async function createRefreshToken(
  userId: string,
  userAgent?: string,
  ipAddress?: string,
): Promise<{ rawToken: string; expiresAt: Date }> {
  const env = getEnv();
  const rawToken = crypto.randomBytes(64).toString("hex");
  const tokenHash = await hashPassword(rawToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: userAgent ?? null,
      ipAddress: ipAddress ?? null,
    },
  });

  return { rawToken, expiresAt };
}

export async function validateRefreshToken(rawToken: string) {
  const candidates = await prisma.refreshToken.findMany({
    where: {
      expiresAt: { gt: new Date() },
      revokedAt: null,
    },
  });

  for (const candidate of candidates) {
    const matches = await bcrypt.compare(rawToken, candidate.tokenHash);
    if (matches) return candidate;
  }

  return null;
}

export async function rotateRefreshToken(
  oldRawToken: string,
  userId: string,
  userAgent?: string,
  ipAddress?: string,
) {
  const oldToken = await validateRefreshToken(oldRawToken);
  if (oldToken) {
    await prisma.refreshToken.update({
      where: { id: oldToken.id },
      data: { revokedAt: new Date() },
    });
  }

  return createRefreshToken(userId, userAgent, ipAddress);
}

export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
