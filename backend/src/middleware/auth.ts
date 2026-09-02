import type { Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/auth.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";
import type { AuthenticatedRequest } from "../types/index.js";

const ROLE_RANK: Record<string, number> = {
  USER: 0,
  PROPERTY_DEVELOPER: 1,
  ADMIN: 2,
};

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or malformed Authorization header");
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
    } else {
      next(new UnauthorizedError("Invalid or expired token"));
    }
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Not authenticated"));
    }

    const userRank = ROLE_RANK[req.user.role] ?? -1;
    const hasAccess = allowedRoles.some((role) => {
      const requiredRank = ROLE_RANK[role] ?? Infinity;
      return userRank >= requiredRank;
    });

    if (!hasAccess) {
      return next(
        new ForbiddenError(
          `Insufficient permissions. Required: ${allowedRoles.join(" or ")}. Your role: ${req.user.role}`,
        ),
      );
    }

    next();
  };
}
