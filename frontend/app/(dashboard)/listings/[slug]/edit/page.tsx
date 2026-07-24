import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DashboardPageContainer } from "@/components/dashboard/DashboardPageContainer";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { ListingForm } from "@/components/dashboard/listings/ListingForm";
import { ROUTES } from "@/constants/routes";
import { listingService } from "@/services";

interface EditListingPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: EditListingPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const listing = await listingService.getListingForEdit(slug);
    return { title: `Edit ${listing.title} | ByTe` };
  } catch {
    return { title: "Listing not found | ByTe" };
  }
}

export default async function EditListingPage({
  params,
}: EditListingPageProps) {
  const { slug } = await params;

  const listing = await listingService
    .getListingForEdit(slug)
    .catch(() => notFound());

  return (
    <DashboardPageContainer>
      <DashboardPageHeader
        title={listing.title || "Untitled Listing"}
        description="Edit your listing details, pricing, and photos."
        breadcrumbs={[
          { label: "My Properties", href: ROUTES.LISTINGS },
          { label: listing.title || "Untitled Listing" },
          { label: "Edit" },
        ]}
      />
      <ListingForm mode="edit" listing={listing} />
    </DashboardPageContainer>
  );
}
