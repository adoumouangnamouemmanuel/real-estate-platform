import { api } from "@/lib/api";
import type { AnalyticsPeriod, AnalyticsSnapshot, ApiResponse } from "@/types";

/**
 * The Analytics domain's only service — one backend endpoint returns the full
 * pre-computed snapshot (funnel, portfolio, stats, action-needed) for the
 * requested period.
 */
export const analyticsService = {
  getSnapshot: (
    period: AnalyticsPeriod = "30d",
  ): Promise<AnalyticsSnapshot> =>
    api
      .get<ApiResponse<AnalyticsSnapshot>>("/developers/me/analytics", {
        params: { period },
      })
      .then((res) => res.data.data),
};
