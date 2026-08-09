"use client";

import {
  BadgeCheck,
  Building2,
  Eye,
  FileText,
  type LucideIcon,
} from "lucide-react";

import { ErrorState } from "@/components/common/ErrorState";
import { StatCard } from "@/components/dashboard/StatCard";
import { useDashboardMetrics } from "@/hooks/useDashboard";
import { formatCompactNumber } from "@/lib/formatters";
import type { DashboardMetrics } from "@/types";

interface KpiSpec {
  key: keyof DashboardMetrics;
  label: string;
  icon: LucideIcon;
  hint: string;
  /** Compact-format large counts (views); leave small counts as-is. */
  compact?: boolean;
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
  {
    key: "totalPropertyViews",
    label: "Total Property Views",
    icon: Eye,
    hint: "All time",
    compact: true,
  },
];

const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-4";

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
      {KPIS.map((kpi) => {
        const raw = data[kpi.key];
        return (
          <StatCard
            key={kpi.key}
            label={kpi.label}
            value={kpi.compact ? formatCompactNumber(raw) : raw}
            icon={kpi.icon}
            hint={kpi.hint}
          />
        );
      })}
    </div>
  );
}
