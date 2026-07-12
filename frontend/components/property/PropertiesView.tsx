"use client";

import { useRouter } from "next/navigation";

import { Pagination } from "@/components/common/Pagination";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { ROUTES } from "@/constants/routes";
import { useProperties } from "@/hooks/useProperties";

interface PropertiesViewProps {
  page: number;
}

/**
 * Reads/writes the current page via the URL (through the page.tsx searchParams prop and
 * router.push here) rather than local state, so Phase 2.3's filters can extend the same
 * query string without restructuring this component.
 */
export function PropertiesView({ page }: PropertiesViewProps) {
  const router = useRouter();
  const { data, isLoading, isError, error } = useProperties({ page });

  function handlePageChange(nextPage: number) {
    router.push(`${ROUTES.PROPERTIES}?page=${nextPage}`, { scroll: false });
  }

  return (
    <div className="container-page flex flex-col gap-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
        <p className="text-muted-foreground text-sm">
          {data ? `${data.total} listings` : "Browse verified listings"}
        </p>
      </div>

      <PropertyGrid
        properties={data?.items ?? []}
        isLoading={isLoading}
        isError={isError}
        error={error}
      />

      {data && data.totalPages > 1 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
