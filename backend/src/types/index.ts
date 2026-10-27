import type { Request } from "express";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface ApplicationIdentity {
  userId: string;
  role: "USER" | "PROPERTY_DEVELOPER" | "ADMIN";
  developerId?: string;
}

export interface AuthenticatedRequest extends Request {
  user: ApplicationIdentity;
}
