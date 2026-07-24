"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { analyticsService } from "@/services";
import type { AnalyticsPeriod } from "@/types";

const ANALYTICS_KEY = ["analytics"] as const;

/**
 * One query for the whole page: Action Needed, the stat row, the funnel, and
 * the portfolio composition are all read from a single `AnalyticsSnapshot`,
 * not four separate fetches — they're already computed together server-side
 * (well, mock-side) in `analyticsService.getSnapshot`, so splitting the
 * request here would just add waterfalls for no benefit. No polling: none of
 * these numbers are real-time-sensitive the way Notifications' unread count
 * is, so a plain fetch on mount/period-change is correct.
 */
export function useAnalyticsSnapshot(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: [...ANALYTICS_KEY, period],
    queryFn: () => analyticsService.getSnapshot(period),
    placeholderData: keepPreviousData,
  });
}
