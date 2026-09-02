import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/errors.js";
import type { ApiError as ApiErrorType } from "../types/index.js";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    const body: ApiErrorType = {
      success: false,
      message: err.message,
    };
    if (err.code) body.code = err.code;
    if (err.errors) body.errors = err.errors;

    res.status(err.statusCode).json(body);
    return;
  }

  if (err.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as unknown as { code: string; meta?: { target?: string[] } };

    if (prismaErr.code === "P2002") {
      const field = prismaErr.meta?.target?.[0] ?? "value";
      res.status(409).json({
        success: false,
        message: `A record with this ${field} already exists.`,
        code: "CONFLICT",
      });
      return;
    }

    if (prismaErr.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Resource not found.",
        code: "NOT_FOUND",
      });
      return;
    }
  }

  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "An internal server error occurred.",
    code: "INTERNAL_ERROR",
  });
}
