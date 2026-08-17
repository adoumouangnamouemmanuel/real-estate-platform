export const ROUTES = {
  HOME: "/",
  PROPERTIES: "/properties",
  PROPERTY_DETAIL: (id: string) => `/properties/${id}`,
  DEVELOPERS: "/developers",
  DEVELOPER_DETAIL: (id: string) => `/developers/${id}`,
  /**
   * The developer's profile, scrolled to its Contact section. The only contact
   * detail the frontend actually holds is `DeveloperProfile.email`, which the
   * profile page already renders — this route exists so a property page can
   * point at it explicitly instead of leaving a buyer to hunt for it.
   */
  DEVELOPER_CONTACT: (id: string) => `/developers/${id}#contact`,
  SEARCH: "/search",
  SAVED: "/saved",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  UNAUTHORIZED: "/unauthorized",
  FORBIDDEN: "/forbidden",
  DASHBOARD: "/dashboard",
  LISTINGS: "/listings",
  NEW_LISTING: "/listings/new",
  EDIT_LISTING: (id: string) => `/listings/${id}/edit`,
  APPOINTMENTS: "/appointments",
  ANALYTICS: "/analytics",
  NOTIFICATIONS: "/notifications",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  ADMIN: "/admin",
  ADMIN_DEVELOPERS: "/admin/developers",
  ADMIN_LISTINGS: "/admin/listings",
  ADMIN_REPORTS: "/admin/reports",
} as const;
