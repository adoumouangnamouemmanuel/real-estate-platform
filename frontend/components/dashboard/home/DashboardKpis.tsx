"use client";

import {
  Bell,
  BadgeCheck,
  Building2,
  CalendarClock,
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
    key: "appointmentRequests",
    label: "Appointment Requests",
    icon: CalendarClock,
    hint: "Awaiting your response",
  },
  {
    key: "unreadNotifications",
    label: "Unread Notifications",
    icon: Bell,
    hint: "Since you last checked",
  },
  {
    key: "totalPropertyViews",
    label: "Total Property Views",
    icon: Eye,
    hint: "All time",
    compact: true,
  },
];

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
