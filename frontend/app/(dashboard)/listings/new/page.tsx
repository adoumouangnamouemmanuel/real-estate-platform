import type { Metadata } from "next";

import { DashboardPageContainer } from "@/components/dashboard/DashboardPageContainer";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { ListingForm } from "@/components/dashboard/listings/ListingForm";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Add Property | ByTe",
  description: "Create a new property listing.",
};

export default function NewListingPage() {
  return (
    <DashboardPageContainer>
      <DashboardPageHeader
        title="Add Property"
        description="Fill in as much as you have — it saves automatically as a draft."
        breadcrumbs={[
          { label: "My Properties", href: ROUTES.LISTINGS },
          { label: "Add Property" },
        ]}
      />
      <ListingForm mode="create" />
    </DashboardPageContainer>
  );
}
