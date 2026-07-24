"use client";

import { ANALYTICS_PERIOD_OPTIONS } from "@/lib/analyticsFilters";
import type { AnalyticsPeriod } from "@/types";

interface AnalyticsPeriodSelectorProps {
  period: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
}

/** A native `<select>`, matching every other filter control in this app — free keyboard support, nothing new to test. */
export function AnalyticsPeriodSelector({
  period,
  onChange,
}: AnalyticsPeriodSelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="analytics-period" className="text-muted-foreground text-xs">
        Period
      </label>
      <select
        id="analytics-period"
        value={period}
        onChange={(event) => onChange(event.target.value as AnalyticsPeriod)}
        className="border-border bg-background h-8 rounded-md border px-2 text-sm"
      >
        {ANALYTICS_PERIOD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
