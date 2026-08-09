"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  CalendarPlus,
  FileWarning,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ActionNeededItem, ActionNeededType } from "@/types";

/** One canonical icon per ActionNeededType across the whole app — Analytics and Dashboard Home both read this map, so a new type can't ship without a matching icon in exactly one place. */
const ACTION_NEEDED_ICON: Record<ActionNeededType, LucideIcon> = {
  OVERDUE_APPOINTMENTS: CalendarClock,
  STALE_DRAFTS: FileWarning,
  HIGH_CANCELLATION_RATE: TrendingDown,
  NEW_APPOINTMENT_REQUESTS: CalendarPlus,
  SUSPENDED_LISTINGS: Ban,
};

interface ActionNeededListProps {
  items: ActionNeededItem[];
  isLoading: boolean;
  /**
   * Optional: only Dashboard Home passes this, since its action-needed query
   * is independent from its sibling widgets (one-query-per-widget, same as
   * RecentListings/AppointmentOverview). Analytics fetches everything
   * (including its own action-needed items) as one combined snapshot and
   * already short-circuits to a page-level ErrorState before this component
   * ever renders, so it never needs to pass this.
   */
  isError?: boolean;
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * "What should I act on today" — a first-class feature (originally Phase
 * 6.7's Analytics design review, now shared with Dashboard Home), not a
 * decorative banner: every item deep-links straight into the already-
 * filtered view that resolves it, and always renders above the fold.
 * Severity is never color-only — the left border color is supplementary,
 * `StatusBadge`'s text label carries the meaning, same rule
 * `PropertyStatusBadge`/`AppointmentStatusBadge` already follow.
 */
export function ActionNeededList({
  items,
  isLoading,
  isError = false,
  title = "Action Needed",
  description = "What to look at today.",
  emptyTitle = "Nothing needs your attention",
  emptyDescription = "You're all caught up.",
}: ActionNeededListProps) {
  return (
    <DashboardSection
      title={title}
      description={description}
      icon={AlertTriangle}
    >
      {isError ? (
        <ErrorState
          title="Couldn't load what needs your attention."
          description="Please refresh the page to try again."
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const Icon = ACTION_NEEDED_ICON[item.type];
            return (
              <li
                key={item.type}
                className={cn(
                  "border-border flex items-start gap-3 rounded-lg border border-l-4 p-3",
                  item.severity === "high"
                    ? "border-l-red-500"
                    : "border-l-amber-500",
                )}
              >
                <Icon
                  className="text-muted-foreground mt-0.5 size-5 shrink-0"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {item.title}
                    <StatusBadge
                      label={item.severity === "high" ? "High" : "Medium"}
                      tone={item.severity === "high" ? "danger" : "warning"}
                    />
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {item.description}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={item.href} />}
                >
                  View
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardSection>
  );
}
