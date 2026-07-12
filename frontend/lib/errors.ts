import { isAxiosError } from "axios";

import type { ApiResponse } from "@/types";

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

/** Extracts a user-facing message from an API failure, falling back for unexpected shapes. */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.message ?? error.message ?? FALLBACK_MESSAGE;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return FALLBACK_MESSAGE;
}
