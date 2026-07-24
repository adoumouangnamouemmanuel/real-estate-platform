"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useListingStatusCounts } from "@/hooks/useListings";
import { LISTING_STATUS_OPTIONS } from "@/lib/listingFilters";
import { cn } from "@/lib/utils";
import type { PropertyStatus } from "@/types";

interface ListingsStatusSummaryProps {
  activeStatus?: PropertyStatus;
  onSelectStatus: (status: PropertyStatus | undefined) => void;
}

/**
 * A quick-glance count per status across the whole portfolio (not just the current
 * page), doubling as a one-click status filter — clicking the active status again
 * clears the filter. Independent of the table's own loading state since the counts
 * span every page, not just the one currently rendered.
 */
export function ListingsStatusSummary({
  activeStatus,
  onSelectStatus,
}: ListingsStatusSummaryProps) {
  const { data: counts, isLoading } = useListingStatusCounts();

  if (isLoading || !counts) {
    return (
      <div className="flex flex-wrap gap-2">
        {LISTING_STATUS_OPTIONS.map((option) => (
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
      {LISTING_STATUS_OPTIONS.map((option) => {
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
