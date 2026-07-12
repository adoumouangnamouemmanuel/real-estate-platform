import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { DeveloperCard } from "@/components/developer/DeveloperCard";
import { DeveloperCardSkeleton } from "@/components/developer/DeveloperCardSkeleton";
import { getErrorMessage } from "@/lib/errors";
import type { Developer } from "@/types";

interface DeveloperGridProps {
  developers: Developer[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  skeletonCount?: number;
  emptyDescription?: string;
}

const GRID_CLASSNAME = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

/** Same loading/error/empty/grid composition as PropertyGrid, applied to the developer domain. */
export function DeveloperGrid({
  developers,
  isLoading,
  isError,
  error,
  skeletonCount = 6,
  emptyDescription = "Try adjusting your search or check back later.",
}: DeveloperGridProps) {
  if (isError) {
    return (
      <ErrorState
        title="Couldn't load developers"
        description={getErrorMessage(error)}
      />
    );
  }

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className={GRID_CLASSNAME}>
        <span className="sr-only">Loading developers…</span>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <DeveloperCardSkeleton key={index} aria-hidden />
        ))}
      </div>
    );
  }

  if (developers.length === 0) {
    return (
      <EmptyState title="No developers found" description={emptyDescription} />
    );
  }

  return (
    <div className={GRID_CLASSNAME}>
      {developers.map((developer) => (
        <DeveloperCard key={developer.id} developer={developer} />
      ))}
    </div>
  );
}
