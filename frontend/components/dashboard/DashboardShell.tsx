import type { ReactNode } from "react";

import { DashboardMobileNav } from "@/components/dashboard/DashboardMobileNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";

/**
 * The dashboard's chrome: top bar, responsive nav (desktop sidebar / mobile bottom
 * bar), and the content slot every dashboard page renders into. Mounted once by
 * app/(dashboard)/layout.tsx, inside RequireAuth — this is UI layered on top of an
 * already-guarded route group, not a new security boundary.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <DashboardTopBar />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
      <DashboardMobileNav />
    </div>
  );
}
