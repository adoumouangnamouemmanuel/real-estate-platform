import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CalendarCheck,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/constants/routes";
import type { FeatureFlag } from "@/constants/features";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Undefined means always enabled (e.g. Dashboard Home, shipped in Phase 6.0). */
  flag?: FeatureFlag;
}

/**
 * Single source of truth for dashboard navigation, shared by the desktop sidebar and
 * the mobile bottom nav so the two never drift. Items land phase by phase — see the
 * Phase 6 roadmap in docs/ARCHITECTURE.md — each gated by its own feature flag until
 * its phase ships, same pattern as FEATURES.WHATSAPP_CONTACT/MAP_VIEW.
 */
export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  {
    label: "My Properties",
    href: ROUTES.LISTINGS,
    icon: Building2,
    flag: "DASHBOARD_PROPERTIES",
  },
  {
    label: "Appointments",
    href: ROUTES.APPOINTMENTS,
    icon: CalendarCheck,
    flag: "DASHBOARD_APPOINTMENTS",
  },
  {
    label: "Analytics",
    href: ROUTES.ANALYTICS,
    icon: BarChart3,
    flag: "DEVELOPER_ANALYTICS",
  },
  {
    label: "Notifications",
    href: ROUTES.NOTIFICATIONS,
    icon: Bell,
    flag: "DASHBOARD_NOTIFICATIONS",
  },
  {
    label: "Profile & Company",
    href: ROUTES.PROFILE,
    icon: Briefcase,
    flag: "DASHBOARD_PROFILE",
  },
  {
    label: "Account Settings",
    href: ROUTES.SETTINGS,
    icon: Settings,
    flag: "DASHBOARD_SETTINGS",
  },
];

/** The bottom tab bar only has room for a handful of destinations on mobile. */
export const MOBILE_PRIMARY_NAV_COUNT = 3;
