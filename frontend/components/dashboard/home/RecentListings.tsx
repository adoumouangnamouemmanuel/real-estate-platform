"use client";

import Link from "next/link";
import { Building2, MoreHorizontal } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { PropertyStatusBadge } from "@/components/dashboard/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useRecentListings } from "@/hooks/useDashboard";
import { formatPrice, formatRelativeTime } from "@/lib/formatters";
import type { Property } from "@/types";

const COLUMN_COUNT = 4;

function ListingActions({ property }: { property: Property }) {
  const canEdit = isFeatureEnabled("DASHBOARD_PROPERTY_EDITOR");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${property.title}`}
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Latest properties in the developer's portfolio: status, last-updated, and per-row actions. */
export function RecentListings() {
  const { data, isLoading, isError } = useRecentListings();

  const viewAll = isFeatureEnabled("DASHBOARD_PROPERTIES") ? (
    <Button variant="ghost" size="sm" render={<Link href={ROUTES.LISTINGS} />}>
      View all
    </Button>
  ) : undefined;

  return (
    <DashboardSection
      title="Recent Listings"
      description="Your most recently updated properties."
      icon={Building2}
      action={viewAll}
      flush
    >
      {isError ? (
        <ErrorState
          title="Couldn't load your listings."
          description="Please refresh the page to try again."
        />
      ) : isLoading || !data ? (
        <RecentListingsSkeleton />
      ) : data.length === 0 ? (
        <EmptyState
          title="No listings yet"
          description="Your properties will appear here once you add your first listing."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">Property</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last updated</TableHead>
              <TableHead className="px-4 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((property) => (
              <TableRow key={property.id}>
                <TableCell className="px-4">
                  <span className="block max-w-[22ch] truncate font-medium">
                    {property.title}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {property.city} · {formatPrice(property.price)}
                  </span>
                </TableCell>
                <TableCell>
                  <PropertyStatusBadge status={property.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {property.updatedAt
                    ? formatRelativeTime(property.updatedAt)
                    : "—"}
                </TableCell>
                <TableCell className="px-4 text-right">
                  <ListingActions property={property} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DashboardSection>
  );
}

function RecentListingsSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-4">Property</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last updated</TableHead>
          <TableHead className="px-4">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 4 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell className="px-4" colSpan={COLUMN_COUNT}>
              <Skeleton className="h-8 w-full" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
