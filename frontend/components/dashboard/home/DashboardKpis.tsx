"use client";

import { BadgeCheck, Building2, FileText, type LucideIcon } from "lucide-react";

import { ErrorState } from "@/components/common/ErrorState";
import { StatCard } from "@/components/dashboard/StatCard";
import { useDashboardMetrics } from "@/hooks/useDashboard";
import type { DashboardMetrics } from "@/types";

/**
 * Only keys whose values the service actually derives from data. Typed against
 * the required keys of `DashboardMetrics` specifically, so a placeholder metric
 * (currently `totalPropertyViews`, which is optional precisely because nothing
 * sources it) cannot be added back to this row without first being given a real
 * source. See services/dashboard.service.ts.
 */
type SourcedMetric = {
  [K in keyof DashboardMetrics]-?: undefined extends DashboardMetrics[K]
    ? never
    : K;
}[keyof DashboardMetrics];

interface KpiSpec {
  key: SourcedMetric;
  label: string;
  icon: LucideIcon;
  hint: string;
}

/**
 * Portfolio-health stats only — time-sensitive counts (appointment requests,
 * unread notifications) moved to DashboardActionNeeded/the Notifications
 * panel, where they're actionable rather than just a number sitting next to
 * "Total Properties" with identical visual weight (see the Dashboard UX
 * audit). Every tile here answers "what do I have," never "what do I need
 * to do."
 */
const KPIS: KpiSpec[] = [
  {
    key: "totalProperties",
    label: "Total Properties",
    icon: Building2,
    hint: "Across all statuses",
  },
  {
    key: "activeListings",
    label: "Active Listings",
    icon: BadgeCheck,
    hint: "Live and visible to buyers",
  },
  {
    key: "draftListings",
    label: "Draft Listings",
    icon: FileText,
    hint: "Not yet published",
  },
];

// Three tiles, not four: "Total Property Views" was removed (see the type note
// above). `lg:grid-cols-3` keeps them evenly weighted at full width instead of
// leaving a fourth column empty.
const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

/** The six headline KPI tiles, built on the shared StatCard primitive. */
export function DashboardKpis() {
  const { data, isLoading, isError } = useDashboardMetrics();

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load your metrics."
        description="Please refresh the page to try again."
      />
    );
  }

  if (isLoading || !data) {
    return (
      <div className={GRID}>
        {KPIS.map((kpi) => (
          <StatCard key={kpi.key} label={kpi.label} value={0} isLoading />
        ))}
      </div>
    );
  }

  return (
    <div className={GRID}>
      {KPIS.map((kpi) => (
        <StatCard
          key={kpi.key}
          label={kpi.label}
          value={data[kpi.key]}
          icon={kpi.icon}
          hint={kpi.hint}
        />
      ))}
    </div>
  );
}
