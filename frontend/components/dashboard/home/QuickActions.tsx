import Link from "next/link";
import {
  Briefcase,
  Building2,
  CalendarCheck,
  Plus,
  type LucideIcon,
} from "lucide-react";

import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { Badge } from "@/components/ui/badge";
import { isFeatureEnabled } from "@/constants/features";
import { ROUTES } from "@/constants/routes";
import type { FeatureFlag } from "@/constants/features";

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Undefined = always available; otherwise gated until that phase ships. */
  flag?: FeatureFlag;
}

/**
 * Reuses the shell's feature-flag idiom (dashboard-nav.ts / FEATURES): each action
 * points at a real route and renders as a live link once its phase ships, or as a
 * disabled "Soon" control until then — so the panel never links to a page that
 * doesn't exist yet. No data or client state, so this stays a Server Component.
 */
const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Add Property",
    href: ROUTES.NEW_LISTING,
    icon: Plus,
    flag: "DASHBOARD_PROPERTIES",
  },
  {
    label: "View Listings",
    href: ROUTES.LISTINGS,
    icon: Building2,
    flag: "DASHBOARD_PROPERTIES",
  },
  {
    label: "View Appointments",
    href: ROUTES.APPOINTMENTS,
    icon: CalendarCheck,
    flag: "DASHBOARD_APPOINTMENTS",
  },
  {
    label: "Edit Company Profile",
    href: ROUTES.PROFILE,
    icon: Briefcase,
    flag: "DASHBOARD_PROFILE",
  },
];

const TILE_BASE =
  "flex items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-colors";

export function QuickActions() {
  return (
    <DashboardSection
      title="Quick Actions"
      description="Jump straight to what you need."
    >
      <ul className="grid gap-3 sm:grid-cols-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          const enabled = !action.flag || isFeatureEnabled(action.flag);

          return (
            <li key={action.label}>
              {enabled ? (
                <Link
                  href={action.href}
                  className={`${TILE_BASE} border-border hover:border-primary/40 hover:bg-muted/50`}
                >
                  <Icon
                    className="text-muted-foreground size-4.5"
                    aria-hidden
                  />
                  {action.label}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  title={`${action.label} — coming soon`}
                  className={`${TILE_BASE} border-border text-muted-foreground w-full justify-between opacity-60`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="size-4.5" aria-hidden />
                    {action.label}
                  </span>
                  <Badge variant="outline">Soon</Badge>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </DashboardSection>
  );
}
