export const APP_NAME = "Lumavok";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/**
 * Name of the HttpOnly refresh-token cookie set by the backend (docs/ARCHITECTURE.md §6).
 * Assumed pending backend confirmation — update here if the API names it differently.
 */
export const AUTH_COOKIE_NAME = "refresh_token";

/** Placeholder default — docs/ARCHITECTURE.md's examples are Ghana-based; revisit once multi-currency support is scoped. */
export const DEFAULT_CURRENCY = "GHS";
