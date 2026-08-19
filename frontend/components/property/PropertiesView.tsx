"use client";

import { Info } from "lucide-react";

import { FilterChips } from "@/components/common/FilterChips";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { AnimatedNumber } from "@/components/motion";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { FilterPanel } from "@/components/search/FilterPanel";
import { SortSelect } from "@/components/search/SortSelect";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { useProperties } from "@/hooks/useProperties";
import {
  buildPropertyFilterChips,
  hasMixedPriceComparison,
} from "@/lib/propertyFilters";
import type { GetPropertiesParams } from "@/services";

interface PropertiesViewProps {
  filters: GetPropertiesParams;
  heading: string;
  /** Category label above the heading. Omitted on /search, where the query is the context. */
  eyebrow?: string;
  /** Orientation copy. Omitted where the result count already says everything true. */
  lede?: string;
  emptyDescription?: string;
}

/**
 * Shared by /properties and /search — both are the same paginated, filtered listing, just with
 * different headings and entry points. Every piece of state (page, filters) lives in the URL via
 * the page.tsx searchParams prop and router.push here, not local state, so pagination can never
 * silently drop the active filters and vice versa.
 */
export function PropertiesView({
  filters,
  heading,
  eyebrow,
  lede,
  emptyDescription,
}: PropertiesViewProps) {
  const { data, isLoading, isError, error } = useProperties(filters);
  const updateParams = useFilterNavigation<GetPropertiesParams>();

  function handleFilterChange(partial: Partial<GetPropertiesParams>) {
    updateParams({ ...filters, ...partial, page: 1 });
  }

  function handleRemoveFilter(key: keyof GetPropertiesParams) {
    handleFilterChange({ [key]: undefined });
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader eyebrow={eyebrow} title={heading} lede={lede} />

      <div className="container-page page-section flex flex-col gap-6">
        <FilterPanel filters={filters} onApply={handleFilterChange} />
        <FilterChips
          chips={buildPropertyFilterChips(filters)}
          onRemove={handleRemoveFilter}
        />

        {/* The bar that ties the filters to the grid: what the current filters
            actually returned, and the one control that reorders it. Before this
            existed the count was stranded up in the page header, where it read
            as static page furniture rather than as a live response to the
            filters directly above it. */}
        <div className="border-border/60 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <p
            className="text-muted-foreground text-sm"
            aria-live="polite"
            aria-atomic="true"
          >
            {data ? (
              <>
                <AnimatedNumber value={data.total} />
                {data.total === 1 ? " listing" : " listings"}
              </>
            ) : (
              "Loading listings"
            )}
          </p>
          <SortSelect
            value={filters.sort}
            onChange={(sort) => handleFilterChange({ sort })}
          />
        </div>

        {hasMixedPriceComparison(filters) && (
          <p className="text-muted-foreground border-border flex items-start gap-2 border-l-2 py-1 pl-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Sale prices and monthly rents are being ordered together.{" "}
              <button
                type="button"
                onClick={() => handleFilterChange({ listingType: "SALE" })}
                className="text-foreground focus-visible:ring-ring/50 rounded-sm underline underline-offset-2 outline-none focus-visible:ring-3"
              >
                Show sales only
              </button>{" "}
              or{" "}
              <button
                type="button"
                onClick={() => handleFilterChange({ listingType: "RENT" })}
                className="text-foreground focus-visible:ring-ring/50 rounded-sm underline underline-offset-2 outline-none focus-visible:ring-3"
              >
                rentals only
              </button>{" "}
              to compare like with like.
            </span>
          </p>
        )}

        <PropertyGrid
          properties={data?.items ?? []}
          isLoading={isLoading}
          isError={isError}
          error={error}
          emptyDescription={emptyDescription}
        />

        {data && data.totalPages > 1 && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={(page) => updateParams({ ...filters, page })}
          />
        )}
      </div>
    </div>
  );
}
