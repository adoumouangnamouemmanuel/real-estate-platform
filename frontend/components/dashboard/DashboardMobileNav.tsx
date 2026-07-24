"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ROUTES } from "@/constants/routes";
import { isFeatureEnabled } from "@/constants/features";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

import { DASHBOARD_NAV_ITEMS, MOBILE_PRIMARY_NAV_COUNT } from "./dashboard-nav";

function isItemActive(pathname: string, href: string): boolean {
  return href === ROUTES.DASHBOARD
    ? pathname === href
    : pathname.startsWith(href);
}

/**
 * Fixed bottom tab bar for <md screens: the highest-priority destinations plus a
 * "More" tab that opens a bottom sheet with the rest. Desktop uses DashboardSidebar
 * instead — the two share one nav config (dashboard-nav.ts) so they can't drift.
 */
export function DashboardMobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { data: unreadCount } = useUnreadNotificationCount();
  const hasUnread = Boolean(unreadCount);

  const primaryItems = DASHBOARD_NAV_ITEMS.slice(0, MOBILE_PRIMARY_NAV_COUNT);
  const moreItems = DASHBOARD_NAV_ITEMS.slice(MOBILE_PRIMARY_NAV_COUNT);
  const moreIsActive = moreItems.some((item) =>
    isItemActive(pathname, item.href),
  );
  // Notifications lives in the "More" sheet on mobile (outside the primary 3
  // tabs) — an aggregate dot on "More" itself gives a glance-able signal
  // without reordering already-shipped primary destinations.
  const moreHasUnread =
    hasUnread &&
    moreItems.some(
      (item) =>
        item.href === ROUTES.NOTIFICATIONS &&
        (!item.flag || isFeatureEnabled(item.flag)),
    );

  return (
    <nav
      aria-label="Dashboard"
      className="border-border bg-background fixed inset-x-0 bottom-0 z-40 flex border-t md:hidden"
    >
      {primaryItems.map((item) => {
        const Icon = item.icon;
        const enabled = !item.flag || isFeatureEnabled(item.flag);
        const active = isItemActive(pathname, item.href);

        if (!enabled) {
          return (
            <button
              key={item.href}
              type="button"
              disabled
              className="text-muted-foreground flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.68rem] font-medium opacity-50"
            >
              <Icon className="size-5" aria-hidden />
              {item.label}
            </button>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.68rem] font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {item.label}
          </Link>
        );
      })}

      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerTrigger
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.68rem] font-medium",
            moreIsActive ? "text-primary" : "text-muted-foreground",
          )}
        >
          <span className="relative">
            <MoreHorizontal className="size-5" aria-hidden />
            {moreHasUnread && (
              <span
                aria-hidden
                className="bg-primary border-background absolute -top-0.5 -right-0.5 size-2 rounded-full border"
              />
            )}
          </span>
          More
          {moreHasUnread && (
            <span className="sr-only">, unread notifications</span>
          )}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>More</DrawerTitle>
            <DrawerDescription>The rest of your dashboard.</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-1 p-4 pt-2">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const enabled = !item.flag || isFeatureEnabled(item.flag);
              const active = isItemActive(pathname, item.href);

              if (!enabled) {
                return (
                  <button
                    key={item.href}
                    type="button"
                    disabled
                    className="text-muted-foreground flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium opacity-50"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="size-4.5" aria-hidden />
                      {item.label}
                    </span>
                    <Badge variant="outline">Soon</Badge>
                  </button>
                );
              }

              const showUnreadBadge =
                item.href === ROUTES.NOTIFICATIONS && hasUnread;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="size-4.5" aria-hidden />
                    {item.label}
                  </span>
                  {showUnreadBadge && (
                    <Badge variant="default" className="tabular-nums">
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </nav>
  );
}
