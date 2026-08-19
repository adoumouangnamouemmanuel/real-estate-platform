import Link from "next/link";
import {
  Briefcase,
  Building2,
  CalendarCheck,
  Plus,
  type LucideIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
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
 * Reuses the shell's feature-flag idiom (dashboard-nav.ts / FEATURES): each
 * action points at a real route and appears once its phase ships. No data or
 * client state, so this stays a Server Component.
 */
const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Add Property",
    href: ROUTES.NEW_LISTING,
    icon: Plus,
    flag: "DASHBOARD_PROPERTY_EDITOR",
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

/**
 * A compact inline row, not its own card — a dedicated equal-height panel
 * for 4 small buttons left a large dead white area next to Recent Listings
 * (see the Dashboard UX audit). Sits directly under the welcome header
 * instead, where "jump straight to what you need" reads as a toolbar, not a
 * destination in its own right.
 */
export function QuickActions() {
  // Same rule the primary nav follows (getAvailableNavItems): an action the
  // product cannot perform yet is omitted, not rendered as a disabled "Soon"
  // control. A quick-actions toolbar is a set of things you can do, so an
  // action you cannot do does not belong in it. The flag architecture is
  // untouched — an action returns the moment its flag flips, and no page is
  // faked in the meantime.
  const availableActions = QUICK_ACTIONS.filter(
    (action) => !action.flag || isFeatureEnabled(action.flag),
  );

  return (
    <div
      aria-label="Quick actions"
      className="flex flex-wrap items-center gap-2"
    >
      {availableActions.map((action, index) => {
        const Icon = action.icon;

        return (
          <Link
            key={action.label}
            href={action.href}
            className={buttonVariants({
              variant: index === 0 ? "default" : "outline",
              className: "gap-2",
            })}
          >
            <Icon aria-hidden />
            {action.label}
          </Link>
        );
      })}
    </div>
  );
}
