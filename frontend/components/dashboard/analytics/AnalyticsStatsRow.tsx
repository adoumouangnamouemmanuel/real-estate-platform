"use client";

import {
  Building2,
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

import { SwipeableStatRow } from "@/components/dashboard/SwipeableStatRow";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCompactNumber } from "@/lib/formatters";
import type { AnalyticsStat } from "@/types";

/** One icon per stat key, chosen to match icons already used for the same
 * concept elsewhere (CalendarCheck/CalendarX mirror the appointment
 * notification icons) rather than decorating arbitrarily. No Trending
 * icons here — none of these stats are compared against a prior period, so
 * an up/down arrow would imply a direction the data doesn't actually show. */
const STAT_ICON: Record<string, LucideIcon> = {
  active_listings: Building2,
  response_rate: CheckCircle2,
  completed_viewings: CalendarCheck,
  cancellation_rate: CalendarX,
};

function formatStatValue(
  value: number,
  format: AnalyticsStat["format"],
): string {
  if (format === "percent") return `${value}%`;
  if (format === "hours") return `${value}h`;
  return formatCompactNumber(value);
}

interface AnalyticsStatsRowProps {
  stats: AnalyticsStat[];
  isLoading: boolean;
}

/**
 * The headline number row — reuses `StatCard`/`Sparkline` exactly as built
 * in Phase 6.0 ("reused for every stat across Home and Analytics"), the
 * first real second consumer of that trend-rendering path. Swipeable on
 * mobile via `SwipeableStatRow`, a plain grid from `sm` up.
 */
export function AnalyticsStatsRow({
  stats,
  isLoading,
}: AnalyticsStatsRowProps) {
  if (isLoading) {
    return (
      <SwipeableStatRow
        items={Array.from({ length: 4 }, (_, index) => ({
          key: `skeleton-${index}`,
          node: <StatCard label="" value={0} isLoading />,
        }))}
      />
    );
  }

  return (
    <SwipeableStatRow
      items={stats.map((stat) => ({
        key: stat.key,
        node: (
          <StatCard
            label={stat.label}
            value={stat.value}
            format={(value) => formatStatValue(value, stat.format)}
            hint={stat.hint}
            trend={stat.trend}
            icon={STAT_ICON[stat.key]}
          />
        ),
      }))}
    />
  );
}
