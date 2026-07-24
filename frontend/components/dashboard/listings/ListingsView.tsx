"use client";

import { useState } from "react";

import { FilterChips } from "@/components/common/FilterChips";
import { Pagination } from "@/components/common/Pagination";
import { DeleteListingDialog } from "@/components/dashboard/listings/DeleteListingDialog";
import { ListingsBulkActionsBar } from "@/components/dashboard/listings/ListingsBulkActionsBar";
import { ListingsFilterBar } from "@/components/dashboard/listings/ListingsFilterBar";
import { ListingsStatusSummary } from "@/components/dashboard/listings/ListingsStatusSummary";
import { ListingsTable } from "@/components/dashboard/listings/ListingsTable";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import {
  useBulkDeleteListings,
  useBulkUpdateListingStatus,
  useDeleteListing,
  useListings,
  useUpdateListingStatus,
} from "@/hooks/useListings";
import { buildListingFilterChips } from "@/lib/listingFilters";
import type { GetListingsParams, StatusTransition } from "@/services";
import type { Property, PropertyStatus } from "@/types";

type DeleteTarget =
  { kind: "single"; property: Property } | { kind: "bulk"; ids: string[] };

interface ListingsViewProps {
  filters: GetListingsParams;
}

/**
 * Orchestrates the My Properties page: URL-driven filters/pagination (mirroring
 * PropertiesView/DevelopersView), page-scoped row selection, the status/delete
 * mutations, and the confirmation dialog shared by both the single-row and bulk
 * delete paths.
 */
export function ListingsView({ filters }: ListingsViewProps) {
  const { data, isLoading, isError, error } = useListings(filters);
  const updateParams = useFilterNavigation<GetListingsParams>();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const updateStatus = useUpdateListingStatus();
  const deleteListing = useDeleteListing();
  const bulkUpdateStatus = useBulkUpdateListingStatus();
  const bulkDelete = useBulkDeleteListings();

  const pendingIds = new Set<string>();
  if (updateStatus.isPending && updateStatus.variables) {
    pendingIds.add(updateStatus.variables.id);
  }
  if (deleteListing.isPending && deleteListing.variables) {
    pendingIds.add(deleteListing.variables);
  }
  if (bulkUpdateStatus.isPending) {
    bulkUpdateStatus.variables?.ids.forEach((id) => pendingIds.add(id));
  }
  if (bulkDelete.isPending) {
    bulkDelete.variables?.forEach((id) => pendingIds.add(id));
  }

  function handleFilterChange(partial: Partial<GetListingsParams>) {
    setSelectedIds(new Set());
    updateParams({ ...filters, ...partial, page: 1 });
  }

  function handleRemoveFilter(key: keyof GetListingsParams) {
    handleFilterChange({ [key]: undefined });
  }

  function handlePageChange(page: number) {
    setSelectedIds(new Set());
    updateParams({ ...filters, page });
  }

  function handleToggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleToggleAll() {
    const pageIds = data?.items.map((item) => item.id) ?? [];
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds(allSelected ? new Set() : new Set(pageIds));
  }

  function handleStatusChange(
    property: Property,
    transition: StatusTransition,
  ) {
    updateStatus.mutate({ id: property.id, status: transition.target });
  }

  function handleBulkStatus(status: PropertyStatus) {
    bulkUpdateStatus.mutate(
      { ids: Array.from(selectedIds), status },
      { onSuccess: () => setSelectedIds(new Set()) },
    );
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;

    if (deleteTarget.kind === "single") {
      deleteListing.mutate(deleteTarget.property.id, {
        onSuccess: () => setDeleteTarget(null),
      });
    } else {
      bulkDelete.mutate(deleteTarget.ids, {
        onSuccess: () => {
          setDeleteTarget(null);
          setSelectedIds(new Set());
        },
      });
    }
  }

  const hasActiveFilters = Boolean(
    filters.q || filters.status || filters.category || filters.listingType,
  );
  const isDeletePending = deleteListing.isPending || bulkDelete.isPending;

  return (
    <div className="flex flex-col gap-6">
      <ListingsStatusSummary
        activeStatus={filters.status}
        onSelectStatus={(status) => handleFilterChange({ status })}
      />

      <ListingsFilterBar filters={filters} onApply={handleFilterChange} />
      <FilterChips
        chips={buildListingFilterChips(filters)}
        onRemove={handleRemoveFilter}
      />

      <ListingsBulkActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkStatus={handleBulkStatus}
        onBulkDeleteRequest={() =>
          setDeleteTarget({ kind: "bulk", ids: Array.from(selectedIds) })
        }
        isPending={bulkUpdateStatus.isPending || bulkDelete.isPending}
      />

      <ListingsTable
        listings={data?.items ?? []}
        isLoading={isLoading}
        isError={isError}
        error={error}
        selectedIds={selectedIds}
        onToggleRow={handleToggleRow}
        onToggleAll={handleToggleAll}
        onStatusChange={handleStatusChange}
        onDeleteRequest={(property) =>
          setDeleteTarget({ kind: "single", property })
        }
        pendingIds={pendingIds}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() =>
          handleFilterChange({
            q: undefined,
            status: undefined,
            category: undefined,
            listingType: undefined,
          })
        }
      />

      {data && data.totalPages > 1 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {deleteTarget && (
        <DeleteListingDialog
          open
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          target={
            deleteTarget.kind === "single"
              ? { title: deleteTarget.property.title }
              : { count: deleteTarget.ids.length }
          }
          onConfirm={handleConfirmDelete}
          isPending={isDeletePending}
        />
      )}
    </div>
  );
}
