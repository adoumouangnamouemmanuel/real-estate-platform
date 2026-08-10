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
    <div className="container-page flex flex-col gap-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Developers</h1>
        <p className="text-muted-foreground text-sm">
          {data ? `${data.total} developers` : "Browse developers"}
        </p>
      </div>

      <DeveloperFilterPanel filters={filters} onApply={handleFilterChange} />
      <FilterChips
        chips={buildDeveloperFilterChips(filters)}
        onRemove={handleRemoveFilter}
      />

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
