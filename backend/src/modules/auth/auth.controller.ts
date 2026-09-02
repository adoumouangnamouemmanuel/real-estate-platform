import type { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service.js";
import type { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput } from "./auth.schema.js";
import { sendSuccess } from "../../utils/response.js";
import { getEnv } from "../../config/env.js";
import type { AuthenticatedRequest } from "../../types/index.js";

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as LoginInput;
    const { session, refreshToken, expiresAt } = await authService.login(
      input,
      req.headers["user-agent"],
      req.ip,
    );

    setRefreshCookie(res, refreshToken, expiresAt);
    sendSuccess(res, session, 200, "Login successful");
  } catch (err) {
    next(err);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as RegisterInput;
    const { session, refreshToken, expiresAt } = await authService.register(
      input,
      req.headers["user-agent"],
      req.ip,
    );

    setRefreshCookie(res, refreshToken, expiresAt);
    sendSuccess(res, session, 201, "Registration successful");
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const env = getEnv();
    const rawRefreshToken = req.cookies[env.AUTH_COOKIE_NAME];

    if (!rawRefreshToken) {
      res.status(401).json({
        success: false,
        message: "No refresh token provided",
        code: "UNAUTHORIZED",
      });
      return;
    }

    const { session, refreshToken, expiresAt } = await authService.refresh(
      rawRefreshToken,
      req.headers["user-agent"],
      req.ip,
    );

    setRefreshCookie(res, refreshToken, expiresAt);
    sendSuccess(res, session, 200, "Token refreshed");
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    await authService.logout(authReq.user.userId);

    const env = getEnv();
    res.clearCookie(env.AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
    });

    sendSuccess(res, null, 200, "Logged out successfully");
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as ForgotPasswordInput;
    await authService.forgotPassword(input);
    // Always returns 200 — anti-enumeration
    sendSuccess(res, null, 200, "If an account with that email exists, a reset link has been sent.");
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as ResetPasswordInput;
    await authService.resetPassword(input);
    sendSuccess(res, null, 200, "Password has been reset successfully.");
  } catch (err) {
    next(err);
  }
}

export async function validateResetToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.params.token as string;
    const result = await authService.validateResetToken(token);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

function setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
  const env = getEnv();
  res.cookie(env.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    expires: expiresAt,
    path: "/",
  });
}
