"use client";

import { usePathname, useRouter } from "next/navigation";

import { Pagination } from "@/components/common/Pagination";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { FilterChips } from "@/components/search/FilterChips";
import { FilterPanel } from "@/components/search/FilterPanel";
import { useProperties } from "@/hooks/useProperties";
import type { GetPropertiesParams } from "@/services";

interface PropertiesViewProps {
  filters: GetPropertiesParams;
  heading: string;
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
  emptyDescription,
}: PropertiesViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading, isError, error } = useProperties(filters);

  function updateParams(next: GetPropertiesParams) {
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleFilterChange(partial: Partial<GetPropertiesParams>) {
    updateParams({ ...filters, ...partial, page: 1 });
  }

  function handleRemoveFilter(key: keyof GetPropertiesParams) {
    handleFilterChange({ [key]: undefined });
  }

  return (
    <div className="container-page flex flex-col gap-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
        <p className="text-muted-foreground text-sm">
          {data ? `${data.total} listings` : "Browse verified listings"}
        </p>
      </div>

      <FilterPanel filters={filters} onApply={handleFilterChange} />
      <FilterChips filters={filters} onRemove={handleRemoveFilter} />

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
  );
}
