"use client";

import { FilterChips } from "@/components/common/FilterChips";
import { Pagination } from "@/components/common/Pagination";
import { DeveloperFilterPanel } from "@/components/developer/DeveloperFilterPanel";
import { DeveloperGrid } from "@/components/developer/DeveloperGrid";
import { useDevelopers } from "@/hooks/useDevelopers";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { buildDeveloperFilterChips } from "@/lib/developerFilters";
import type { GetDevelopersParams } from "@/services";

interface DevelopersViewProps {
  filters: GetDevelopersParams;
}

/** Mirrors PropertiesView: filters live in the URL, pagination carries the full filter set. */
export function DevelopersView({ filters }: DevelopersViewProps) {
  const { data, isLoading, isError, error } = useDevelopers(filters);
  const updateParams = useFilterNavigation<GetDevelopersParams>();

  function handleFilterChange(partial: Partial<GetDevelopersParams>) {
    updateParams({ ...filters, ...partial, page: 1 });
  }

  function handleRemoveFilter(key: keyof GetDevelopersParams) {
    handleFilterChange({ [key]: undefined });
  }

  return (
    // `flex-1` is a layout fix, not styling: the public <main> is a column flex
    // container, and without it a short result set (three developers is one
    // row) left the footer floating mid-viewport above ~500px of dead space.
    <div className="container-page flex flex-1 flex-col gap-6 py-10">
      <DeveloperFilterPanel filters={filters} onApply={handleFilterChange} />
      <FilterChips
        chips={buildDeveloperFilterChips(filters)}
        onRemove={handleRemoveFilter}
      />

      {/* Reads straight off the query result — no rounding, no "500+" framing.
          Hidden while loading rather than showing a zero that would flicker. */}
      {data && (
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {data.total} {data.total === 1 ? "developer" : "developers"}
        </p>
      )}

      <DeveloperGrid
        developers={data?.items ?? []}
        isLoading={isLoading}
        isError={isError}
        error={error}
      />

      {data && data.totalPages > 1 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={(page) => updateParams({ ...filters, page })}
        />
      )}
    </div>
  );
}
