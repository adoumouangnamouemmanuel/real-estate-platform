"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { PropertyStatusBadge } from "@/components/dashboard/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isFeatureEnabled } from "@/constants/features";
import { ROUTES } from "@/constants/routes";
import { getErrorMessage } from "@/lib/errors";
import { formatPrice, formatRelativeTime } from "@/lib/formatters";
import {
  canDeleteListing,
  getAvailableTransitions,
  type StatusTransition,
} from "@/services";
import type { Property } from "@/types";

const COLUMN_COUNT = 7;

interface ListingsTableProps {
  listings: Property[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  onStatusChange: (property: Property, transition: StatusTransition) => void;
  onDeleteRequest: (property: Property) => void;
  /** Listing IDs with a mutation currently in flight — disables that row's action menu. */
  pendingIds: Set<string>;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

/**
 * A native input, not the <Checkbox> wrapper: the indeterminate visual state can
 * only be set imperatively via the DOM property (there's no HTML attribute for
 * it), which needs a direct ref onto the underlying <input>.
 */
function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) {
  return (
    <input
      type="checkbox"
      ref={(node) => {
        if (node) node.indeterminate = indeterminate;
      }}
      checked={checked}
      onChange={onChange}
      aria-label="Select all listings on this page"
      className="border-border accent-primary focus-visible:ring-ring/50 size-4 shrink-0 rounded-sm border focus-visible:ring-3 focus-visible:outline-none"
    />
  );
}

function RowActions({
  property,
  onStatusChange,
  onDeleteRequest,
  disabled,
}: {
  property: Property;
  onStatusChange: (property: Property, transition: StatusTransition) => void;
  onDeleteRequest: (property: Property) => void;
  disabled: boolean;
}) {
  const canEdit = isFeatureEnabled("DASHBOARD_PROPERTY_EDITOR");
  const transitions = getAvailableTransitions(property.status);
  const deletable = canDeleteListing(property.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${property.title}`}
        disabled={disabled}
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          render={<Link href={ROUTES.PROPERTY_DETAIL(property.slug)} />}
        >
          View listing
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!canEdit}
          {...(canEdit
            ? { render: <Link href={ROUTES.EDIT_LISTING(property.slug)} /> }
            : {})}
        >
          {canEdit ? "Edit listing" : "Edit listing (soon)"}
        </DropdownMenuItem>
        {transitions.length > 0 && <DropdownMenuSeparator />}
        {transitions.map((transition) => (
          <DropdownMenuItem
            key={transition.target}
            onClick={() => onStatusChange(property, transition)}
          >
            {transition.label}
          </DropdownMenuItem>
        ))}
        {deletable && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDeleteRequest(property)}
            >
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The My Properties table: bulk-selectable rows, a status-aware action menu per
 * row (only the transitions valid for that listing's current status, plus Delete
 * only when the status allows it), loading skeleton, and both a true-empty and a
 * filtered-to-nothing empty state.
 */
export function ListingsTable({
  listings,
  isLoading,
  isError,
  error,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onStatusChange,
  onDeleteRequest,
  pendingIds,
  hasActiveFilters,
  onClearFilters,
}: ListingsTableProps) {
  if (isError) {
    return (
      <ErrorState
        title="Couldn't load your properties."
        description={getErrorMessage(error)}
      />
    );
  }

  if (isLoading) {
    return <ListingsTableSkeleton />;
  }

  if (listings.length === 0) {
    return hasActiveFilters ? (
      <EmptyState
        title="No listings match your filters"
        description="Try adjusting or clearing your search and filters."
        action={
          <button
            type="button"
            onClick={onClearFilters}
            className="text-primary text-sm font-medium hover:underline"
          >
            Clear filters
          </button>
        }
      />
    ) : (
      <EmptyState
        title="No properties yet"
        description="Properties you add will appear here."
      />
    );
  }

  const allSelected =
    listings.length > 0 && listings.every((item) => selectedIds.has(item.id));
  const someSelected = listings.some((item) => selectedIds.has(item.id));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 px-4">
            <SelectAllCheckbox
              checked={allSelected}
              indeterminate={someSelected && !allSelected}
              onChange={onToggleAll}
            />
          </TableHead>
          <TableHead>Property</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last updated</TableHead>
          <TableHead className="px-4 text-right">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {listings.map((property) => (
          <TableRow
            key={property.id}
            data-state={selectedIds.has(property.id) ? "selected" : undefined}
          >
            <TableCell className="px-4">
              <Checkbox
                checked={selectedIds.has(property.id)}
                onChange={() => onToggleRow(property.id)}
                aria-label={`Select ${property.title}`}
              />
            </TableCell>
            <TableCell>
              <span className="block max-w-[28ch] truncate font-medium">
                {property.title}
              </span>
              <span className="text-muted-foreground text-xs">
                {property.city}, {property.region}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {property.listingType === "SALE" ? "For Sale" : "For Rent"}
            </TableCell>
            <TableCell>{formatPrice(property.price)}</TableCell>
            <TableCell>
              <PropertyStatusBadge status={property.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {property.updatedAt
                ? formatRelativeTime(property.updatedAt)
                : "—"}
            </TableCell>
            <TableCell className="px-4 text-right">
              <RowActions
                property={property}
                onStatusChange={onStatusChange}
                onDeleteRequest={onDeleteRequest}
                disabled={pendingIds.has(property.id)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ListingsTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 px-4">
            <span className="sr-only">Select</span>
          </TableHead>
          <TableHead>Property</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last updated</TableHead>
          <TableHead className="px-4">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={COLUMN_COUNT} className="p-0">
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col gap-2 p-4"
            >
              <span className="sr-only">Loading properties…</span>
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" aria-hidden />
              ))}
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
