import type { ReactNode } from "react";

import { SkipToContentLink } from "@/components/common/SkipToContentLink";
import { DashboardMobileNav } from "@/components/dashboard/DashboardMobileNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";

/**
 * The dashboard's chrome: top bar, responsive nav (desktop sidebar / mobile bottom
 * bar), and the content slot every dashboard page renders into. Mounted once by
 * app/(dashboard)/layout.tsx, inside RequireAuth — this is UI layered on top of an
 * already-guarded route group, not a new security boundary.
 *
 * Layout contract: `DashboardMobileNav` is `fixed`, so it never occupies space in
 * normal document flow — nothing pushes page content out from under it on its
 * own. `<main>` reserves that space itself below `md` via the shared
 * `--dashboard-mobile-nav-h` token (see globals.css), so every dashboard page's
 * last piece of real content clears the nav without having to know it exists.
 * A page that ALSO has its own sticky/fixed bottom element (e.g.
 * ListingPublishBar) still needs its own `bottom-dashboard-mobile-nav md:bottom-0`
 * — sticky positioning offsets are relative to the viewport edge, not to a
 * sibling's padding, so this shell-level reservation alone can't cover that case.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipToContentLink targetId="dashboard-main-content" />
      <DashboardTopBar />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main
          id="dashboard-main-content"
          tabIndex={-1}
          className="pb-dashboard-mobile-nav flex min-w-0 flex-1 flex-col outline-none md:pb-0"
        >
          {children}
        </main>
      </div>
      <DashboardMobileNav />
    </div>
  );
}
