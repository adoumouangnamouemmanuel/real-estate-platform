"use client";

import { ActionNeededList } from "@/components/dashboard/ActionNeededList";
import { AnalyticsPeriodSelector } from "@/components/dashboard/analytics/AnalyticsPeriodSelector";
import { AnalyticsStatsRow } from "@/components/dashboard/analytics/AnalyticsStatsRow";
import { AppointmentFunnelChart } from "@/components/dashboard/analytics/AppointmentFunnelChart";
import { PortfolioCompositionTable } from "@/components/dashboard/analytics/PortfolioCompositionTable";
import { ErrorState } from "@/components/common/ErrorState";
import { MotionReveal } from "@/components/motion";
import { useAnalyticsSnapshot } from "@/hooks/useAnalytics";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { getErrorMessage } from "@/lib/errors";
import type { AnalyticsPeriod } from "@/types";

interface AnalyticsViewProps {
  period: AnalyticsPeriod;
}

/**
 * Orchestrates the Analytics page. Action Needed and Portfolio Composition
 * are always current-state and never re-fetch on period change (see
 * lib/analyticsCalculations.ts); the stat row and funnel are the only
 * period-scoped sections. Everything comes from one `useAnalyticsSnapshot`
 * query — splitting it into per-section fetches would just add waterfalls
 * for data that's already computed together.
 */
export function AnalyticsView({ period }: AnalyticsViewProps) {
  const { data, isLoading, isError, error } = useAnalyticsSnapshot(period);
  const updateParams = useFilterNavigation<{ period: AnalyticsPeriod }>();

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load your analytics."
        description={getErrorMessage(error)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ActionNeededList
        items={data?.actionNeeded ?? []}
        isLoading={isLoading}
        emptyDescription="You're caught up on appointments and drafts."
      />

      <div className="flex justify-end">
        <AnalyticsPeriodSelector
          period={period}
          onChange={(next) => updateParams({ period: next })}
        />
      </div>

      <MotionReveal key={`stats-${period}`}>
        <AnalyticsStatsRow stats={data?.stats ?? []} isLoading={isLoading} />
      </MotionReveal>

      <MotionReveal
        key={`charts-${period}`}
        className="grid gap-6 lg:grid-cols-2"
      >
        <AppointmentFunnelChart funnel={data?.funnel} isLoading={isLoading} />
        <PortfolioCompositionTable
          portfolio={data?.portfolio}
          isLoading={isLoading}
        />
      </MotionReveal>
    </div>
  );
}
