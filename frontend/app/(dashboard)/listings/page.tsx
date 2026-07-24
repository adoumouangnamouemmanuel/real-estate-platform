import type { Metadata } from "next";

import { DashboardPageContainer } from "@/components/dashboard/DashboardPageContainer";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { ListingsView } from "@/components/dashboard/listings/ListingsView";
import {
  parseListingFilters,
  type RawListingSearchParams,
} from "@/lib/listingFilters";

export const metadata: Metadata = {
  title: "My Properties | ByTe",
  description: "Manage your property portfolio.",
};

interface ListingsPageProps {
  searchParams: Promise<RawListingSearchParams>;
}

/**
 * Phase 6.2 — My Properties. Listing management only (search, filter, sort,
 * pagination, status changes, delete); the create/edit form is a later phase
 * (FEATURES.DASHBOARD_PROPERTY_EDITOR), so "Edit" renders disabled here too.
 */
export default async function ListingsPage({
  searchParams,
}: ListingsPageProps) {
  const filters = parseListingFilters(await searchParams);

  return (
    <DashboardPageContainer>
      <DashboardPageHeader
        title="My Properties"
        description="Search, filter, and manage your property portfolio."
      />
      <ListingsView filters={filters} />
    </DashboardPageContainer>
  );
}
