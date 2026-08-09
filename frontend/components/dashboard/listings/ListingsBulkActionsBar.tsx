"use client";

import { Button } from "@/components/ui/button";
import type { PropertyStatus } from "@/types";

interface ListingsBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkStatus: (status: PropertyStatus) => void;
  onBulkDeleteRequest: () => void;
  isPending: boolean;
}

/**
 * Appears once at least one row is selected. Offers the three most common
 * portfolio-management moves — Publish, Suspend, Delete — rather than every
 * possible transition; each applies only to the selected rows it's actually
 * valid for and reports what it skipped (see listingService.bulkUpdateStatus).
 */
export function ListingsBulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkStatus,
  onBulkDeleteRequest,
  isPending,
}: ListingsBulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className="border-border bg-muted/50 animate-in fade-in slide-in-from-top-1 flex flex-wrap items-center gap-3 rounded-lg border p-3 duration-200"
    >
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <div className="ml-auto flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => onBulkStatus("ACTIVE")}
        >
          Publish / Reopen
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => onBulkStatus("SUSPENDED")}
        >
          Suspend
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={onBulkDeleteRequest}
        >
          Delete
        </Button>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear selection
        </Button>
      </div>
    </div>
  );
}
