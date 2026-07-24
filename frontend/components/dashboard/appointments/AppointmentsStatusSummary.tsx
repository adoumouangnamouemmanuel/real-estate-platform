"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useAppointmentStatusCounts } from "@/hooks/useAppointments";
import { APPOINTMENT_STATUS_OPTIONS } from "@/lib/appointmentFilters";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/types";

interface AppointmentsStatusSummaryProps {
  activeStatus?: AppointmentStatus;
  onSelectStatus: (status: AppointmentStatus | undefined) => void;
}

/**
 * A quick-glance count per status across every appointment (not just the current
 * page), doubling as a one-click status filter — mirrors ListingsStatusSummary.
 */
export function AppointmentsStatusSummary({
  activeStatus,
  onSelectStatus,
}: AppointmentsStatusSummaryProps) {
  const { data: counts, isLoading } = useAppointmentStatusCounts();

  if (isLoading || !counts) {
    return (
      <div className="flex flex-wrap gap-2">
        {APPOINTMENT_STATUS_OPTIONS.map((option) => (
          <Skeleton key={option.value} className="h-7 w-24 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Filter by status"
      className="flex flex-wrap gap-2"
    >
      {APPOINTMENT_STATUS_OPTIONS.map((option) => {
        const isActive = activeStatus === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelectStatus(isActive ? undefined : option.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-background hover:bg-muted",
            )}
          >
            {option.label}{" "}
            <span
              className={cn(
                "tabular-nums",
                isActive
                  ? "text-primary-foreground/80"
                  : "text-muted-foreground",
              )}
            >
              {counts[option.value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
