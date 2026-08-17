"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { isFeatureEnabled } from "@/constants/features";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

import { DASHBOARD_NAV_ITEMS } from "./dashboard-nav";

function isItemActive(pathname: string, href: string): boolean {
  return href === ROUTES.DASHBOARD
    ? pathname === href
    : pathname.startsWith(href);
}

/**
 * Persistent desktop navigation: an icon-only rail from md, full icon+label from lg.
 * Hidden below md — the mobile bottom nav (DashboardMobileNav) takes over there.
 */
export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: unreadCount } = useUnreadNotificationCount();
  const hasUnread = Boolean(unreadCount);

  return (
    <aside className="border-sidebar-border bg-sidebar hidden shrink-0 border-r md:flex md:w-16 lg:w-60">
      <nav
        aria-label="Dashboard"
        className="flex w-full flex-col gap-1 p-2 lg:p-3"
      >
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const enabled = !item.flag || isFeatureEnabled(item.flag);
          const active = isItemActive(pathname, item.href);
          const showUnreadBadge =
            enabled && item.href === ROUTES.NOTIFICATIONS && hasUnread;

          if (!enabled) {
            return (
              <button
                key={item.href}
                type="button"
                disabled
                title={`${item.label} — coming soon`}
                className="text-muted-foreground flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium opacity-50 lg:justify-between"
              >
                <span className="flex items-center gap-3">
                  <Icon className="size-4.5 shrink-0" aria-hidden />
                  <span className="hidden lg:inline">{item.label}</span>
                </span>
                <Badge variant="outline" className="hidden lg:inline-flex">
                  Soon
                </Badge>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <span className="relative shrink-0">
                <Icon className="size-4.5" aria-hidden />
                {showUnreadBadge && (
                  <span
                    aria-hidden
                    className="bg-primary border-sidebar absolute -top-1 -right-1 size-2 rounded-full border lg:hidden"
                  />
                )}
              </span>
              <span className="hidden flex-1 items-center justify-between gap-2 lg:flex">
                {item.label}
                {showUnreadBadge && (
                  <Badge variant="default" className="tabular-nums">
                    {unreadCount}
                  </Badge>
                )}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
