import type { Metadata } from "next";

import { AnalyticsView } from "@/components/dashboard/analytics/AnalyticsView";
import { DashboardPageContainer } from "@/components/dashboard/DashboardPageContainer";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  parseAnalyticsPeriod,
  type RawAnalyticsSearchParams,
} from "@/lib/analyticsFilters";

export const metadata: Metadata = {
  title: "Analytics | ByTe",
  description: "Track appointment conversion and portfolio composition.",
};

interface AnalyticsPageProps {
  searchParams: Promise<RawAnalyticsSearchParams>;
}

/**
 * Phase 6.7: decision-making analytics, not decoration — what needs
 * attention today, the appointment conversion funnel, and portfolio
 * composition. Mirrors the other dashboard pages' shell.
 */
export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const period = parseAnalyticsPeriod(await searchParams);

  return (
    <DashboardPageContainer>
      <DashboardPageHeader
        title="Analytics"
        description="What needs your attention, and how your appointments are converting."
      />
      <AnalyticsView period={period} />
    </DashboardPageContainer>
  );
}
