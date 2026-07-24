import type { AnalyticsPeriod } from "@/types";

export type RawAnalyticsSearchParams = Record<
  string,
  string | string[] | undefined
>;

const PERIOD_VALUES: AnalyticsPeriod[] = ["7d", "30d", "90d"];
const DEFAULT_PERIOD: AnalyticsPeriod = "30d";

export const ANALYTICS_PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] =
  [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
  ];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The one place /analytics parses the URL into a typed period — no other
 * filters exist on this page (Action Needed and portfolio composition are
 * deliberately always current-state, not period-scoped, see
 * lib/analyticsCalculations.ts), so there's no FilterChips list to build.
 */
export function parseAnalyticsPeriod(
  raw: RawAnalyticsSearchParams,
): AnalyticsPeriod {
  const period = first(raw.period) as AnalyticsPeriod | undefined;
  return period && PERIOD_VALUES.includes(period) ? period : DEFAULT_PERIOD;
}
