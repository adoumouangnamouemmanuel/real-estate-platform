"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  FileWarning,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ActionNeededItem, ActionNeededType } from "@/types";

const ACTION_NEEDED_ICON: Record<ActionNeededType, LucideIcon> = {
  OVERDUE_APPOINTMENTS: CalendarClock,
  STALE_DRAFTS: FileWarning,
  HIGH_CANCELLATION_RATE: TrendingDown,
};

interface AnalyticsActionNeededProps {
  items: ActionNeededItem[];
  isLoading: boolean;
}

/**
 * "What should I act on today" — a first-class feature (per the Phase 6.7
 * design review), not a decorative banner: every item deep-links straight
 * into the already-filtered Appointments/Listings view that resolves it, and
 * always renders above the fold. Severity is never color-only — the left
 * border color is supplementary, `StatusBadge`'s text label carries the
 * meaning, same rule `PropertyStatusBadge`/`AppointmentStatusBadge` already
 * follow.
 */
export function AnalyticsActionNeeded({
  items,
  isLoading,
}: AnalyticsActionNeededProps) {
  return (
    <DashboardSection
      title="Action Needed"
      description="What to look at today."
      icon={AlertTriangle}
    >
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing needs your attention"
          description="You're caught up on appointments and drafts."
        />
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
