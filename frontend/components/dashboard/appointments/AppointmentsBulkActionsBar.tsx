"use client";

import { Button } from "@/components/ui/button";
import { AppointmentActionPolicy } from "@/lib/appointmentActionPolicy";
import type { AppointmentStatus } from "@/types";

interface AppointmentsBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkStatus: (status: AppointmentStatus) => void;
  isPending: boolean;
  /**
   * The current status of every selected appointment — lets each bulk button
   * disable itself when none of the selection is actually eligible, instead
   * of only discovering that after the fact via the "N skipped" toast.
   * Optional: omitting it (as every existing test does) keeps every action
   * enabled, matching the bar's original behavior.
   */
  selectedStatuses?: AppointmentStatus[];
}

/**
 * Appears once at least one row is selected. Only offers the actions
 * AppointmentActionPolicy marks bulk-safe (Confirm, Cancel) — Reschedule,
 * Complete, and No-Show stay per-appointment, since each depends on a single
 * visit's own outcome or a picked date/time (see the Phase 6.4 review).
 */
export function AppointmentsBulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkStatus,
  isPending,
  selectedStatuses,
}: AppointmentsBulkActionsBarProps) {
  if (selectedCount === 0) return null;

  const bulkActions = AppointmentActionPolicy.getBulkActions();

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className="border-border bg-muted/50 animate-in fade-in slide-in-from-top-1 flex flex-wrap items-center gap-3 rounded-lg border p-3 duration-200"
    >
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <div className="ml-auto flex flex-wrap gap-2">
        {bulkActions.map((action) => {
          const noneEligible =
            selectedStatuses &&
            !selectedStatuses.some((status) =>
              AppointmentActionPolicy.isValidTransition(status, action.target!),
            );

          return (
            <Button
              key={action.key}
              variant="outline"
              size="sm"
              disabled={isPending || noneEligible}
              title={
                noneEligible
                  ? `None of the selected appointments are eligible for "${action.label}".`
                  : undefined
              }
              onClick={() => onBulkStatus(action.target!)}
            >
              {action.label}
            </Button>
          );
        })}
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear selection
        </Button>
      </div>
    </div>
  );
}
