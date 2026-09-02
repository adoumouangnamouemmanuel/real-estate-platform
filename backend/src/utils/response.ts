import type { Response } from "express";
import type { ApiResponse } from "../types/index.js";

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string): void {
  const response: ApiResponse<T> = { success: true, data };
  if (message) response.message = message;
  res.status(statusCode).json(response);
}

export function sendNoContent(res: Response): void {
  res.status(204).end();
}
