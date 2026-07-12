/**
 * Static feature flags for gating incomplete features behind a single toggle
 * instead of commenting code out or shipping half-built UI. No remote config —
 * flip a value here and redeploy. Revisit if flags ever need to vary per-user
 * or change without a deploy.
 */
export const FEATURES = {
  WHATSAPP_CONTACT: false,
  DEVELOPER_ANALYTICS: false,
  ADMIN_REPORTS: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURES[flag];
}
