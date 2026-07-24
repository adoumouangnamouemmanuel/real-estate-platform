"use client";

import { Button } from "@/components/ui/button";
import { AppointmentActionPolicy } from "@/lib/appointmentActionPolicy";
import type { AppointmentStatus } from "@/types";

interface AppointmentsBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkStatus: (status: AppointmentStatus) => void;
  isPending: boolean;
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
}: AppointmentsBulkActionsBarProps) {
  if (selectedCount === 0) return null;

  const bulkActions = AppointmentActionPolicy.getBulkActions();

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className="border-border bg-muted/50 flex flex-wrap items-center gap-3 rounded-lg border p-3"
    >
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <div className="ml-auto flex flex-wrap gap-2">
        {bulkActions.map((action) => (
          <Button
            key={action.key}
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => onBulkStatus(action.target!)}
          >
            {action.label}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear selection
        </Button>
      </div>
    </div>
  );
}
