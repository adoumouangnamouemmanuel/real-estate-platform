"use client";

import { SwipeableStatRow } from "@/components/dashboard/SwipeableStatRow";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCompactNumber } from "@/lib/formatters";
import type { AnalyticsStat } from "@/types";

function formatStatValue(stat: AnalyticsStat): string {
  if (stat.format === "percent") return `${stat.value}%`;
  if (stat.format === "hours") return `${stat.value}h`;
  return formatCompactNumber(stat.value);
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
export function AnalyticsStatsRow({ stats, isLoading }: AnalyticsStatsRowProps) {
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
            value={formatStatValue(stat)}
            hint={stat.hint}
            trend={stat.trend}
          />
        ),
      }))}
    />
  );
}
