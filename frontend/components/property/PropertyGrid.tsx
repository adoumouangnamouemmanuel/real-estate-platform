import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyCardSkeleton } from "@/components/property/PropertyCardSkeleton";
import { getErrorMessage } from "@/lib/errors";
import type { Property } from "@/types";

interface PropertyGridProps {
  properties: Property[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  skeletonCount?: number;
}

const GRID_CLASSNAME = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4";

/** The canonical loading/error/empty/grid composition for property lists — reused by search results too. */
export function PropertyGrid({
  properties,
  isLoading,
  isError,
  error,
  skeletonCount = 8,
}: PropertyGridProps) {
  if (isError) {
    return (
      <ErrorState
        title="Couldn't load properties"
        description={getErrorMessage(error)}
      />
    );
  }

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className={GRID_CLASSNAME}>
        <span className="sr-only">Loading properties…</span>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <PropertyCardSkeleton key={index} aria-hidden />
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <EmptyState
        title="No properties found"
        description="Try adjusting your search or check back later."
      />
    );
  }

  return (
    <div className={GRID_CLASSNAME}>
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
