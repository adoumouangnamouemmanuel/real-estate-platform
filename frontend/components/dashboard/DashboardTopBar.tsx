import Link from "next/link";

import { AccessibilityPanel } from "@/components/common/AccessibilityPanel";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { DashboardUserMenu } from "@/components/dashboard/DashboardUserMenu";
import { GlassSurface } from "@/components/motion";
import { APP_NAME } from "@/constants/config";
import { ROUTES } from "@/constants/routes";

/** Persistent global chrome across every dashboard page — branding and the account menu. */
export function DashboardTopBar() {
  return (
    <GlassSurface as="header" tone="chrome" className="sticky top-0 z-30">
      <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
        <Link
          href={ROUTES.HOME}
          title="Back to the Lumavok homepage"
          className="text-base font-semibold tracking-tight"
        >
          {APP_NAME}{" "}
          <span className="text-muted-foreground font-normal">/ Dashboard</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <AccessibilityPanel />
          <DashboardUserMenu />
        </div>
      </div>
    </GlassSurface>
  );
}
