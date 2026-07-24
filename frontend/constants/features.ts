/**
 * Static feature flags for gating incomplete features behind a single toggle
 * instead of commenting code out or shipping half-built UI. No remote config —
 * flip a value here and redeploy. Revisit if flags ever need to vary per-user
 * or change without a deploy.
 */
export const FEATURES = {
  WHATSAPP_CONTACT: false,
  MAP_VIEW: false,
  DEVELOPER_ANALYTICS: false,
  ADMIN_REPORTS: false,
  // Dashboard modules land phase by phase (see docs/ARCHITECTURE.md's Phase 6 ADR) —
  // each flips to true when its phase ships, same pattern as WHATSAPP_CONTACT/MAP_VIEW.
  // Phase 6.2 shipped listing management (the /listings table) but deliberately not
  // the create/edit form — split into two flags so "My Properties" can go live
  // while Add/Edit stays gated until the Property Editor phase. See ADR-012.
  DASHBOARD_PROPERTIES: true,
  DASHBOARD_PROPERTY_EDITOR: false,
  DASHBOARD_APPOINTMENTS: false,
  DASHBOARD_NOTIFICATIONS: false,
  DASHBOARD_PROFILE: false,
  DASHBOARD_SETTINGS: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURES[flag];
}
