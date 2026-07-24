import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { DashboardPageContainer } from "@/components/dashboard/DashboardPageContainer";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { ListingsView } from "@/components/dashboard/listings/ListingsView";
import { Button } from "@/components/ui/button";
import { isFeatureEnabled } from "@/constants/features";
import { ROUTES } from "@/constants/routes";
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
 * Phase 6.2 shipped listing management (search, filter, sort, pagination,
 * status changes, delete). Phase 6.3 added the create/edit form — this page's
 * own "Add Property" entry point (alongside Dashboard Home's Quick Actions and
 * every row's "Edit listing") completes that navigation flow, gated by the
 * same DASHBOARD_PROPERTY_EDITOR flag the row actions already read.
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
        action={
          isFeatureEnabled("DASHBOARD_PROPERTY_EDITOR") ? (
            <Button render={<Link href={ROUTES.NEW_LISTING} />}>
              <Plus />
              Add Property
            </Button>
          ) : undefined
        }
      />
      <ListingsView filters={filters} />
    </DashboardPageContainer>
  );
}
