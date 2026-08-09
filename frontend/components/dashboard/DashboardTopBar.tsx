import Link from "next/link";

import { DashboardUserMenu } from "@/components/dashboard/DashboardUserMenu";
import { APP_NAME } from "@/constants/config";
import { ROUTES } from "@/constants/routes";

/** Persistent global chrome across every dashboard page — branding and the account menu. */
export function DashboardTopBar() {
  return (
    <header className="border-border bg-background sticky top-0 z-30 border-b">
      <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
        <Link
          href={ROUTES.HOME}
          className="text-base font-semibold tracking-tight"
        >
          {APP_NAME}{" "}
          <span className="text-muted-foreground font-normal">/ Dashboard</span>
        </Link>
        <DashboardUserMenu />
      </div>
    </header>
  );
}
