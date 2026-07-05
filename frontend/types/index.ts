export type UserRole = "USER" | "DEVELOPER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  developerId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
