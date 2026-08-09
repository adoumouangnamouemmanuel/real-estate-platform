"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, MoreHorizontal, Pencil } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { PropertyStatusBadge } from "@/components/dashboard/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
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
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={disabled || !canEdit}
        aria-label={`Edit ${property.title}`}
        title={canEdit ? "Edit listing" : "Edit listing (soon)"}
        {...(canEdit
          ? { render: <Link href={ROUTES.EDIT_LISTING(property.slug)} /> }
          : {})}
      >
        <Pencil />
      </Button>
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
    </div>
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
              <div className="flex items-center gap-3">
                <div className="bg-muted relative size-10 shrink-0 overflow-hidden rounded-md">
                  {property.media[0] ? (
                    <Image
                      src={property.media[0].url}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                      <Building2 className="size-4" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="block max-w-[24ch] truncate font-medium">
                    {property.title}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {property.city}, {property.region}
                  </span>
                </div>
              </div>
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
      <TableBody role="status" aria-live="polite">
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={COLUMN_COUNT} className="sr-only">
            Loading properties…
          </TableCell>
        </TableRow>
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index} aria-hidden className="hover:bg-transparent">
            <TableCell className="px-4">
              <Skeleton className="size-4 rounded-sm" />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-md" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-14" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell className="px-4">
              <Skeleton className="ml-auto h-7 w-14" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
