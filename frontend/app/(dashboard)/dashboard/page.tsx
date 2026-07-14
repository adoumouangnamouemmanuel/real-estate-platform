import type { Metadata } from "next";

import { DashboardPageContainer } from "@/components/dashboard/DashboardPageContainer";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { EmptyState } from "@/components/common/EmptyState";

export const metadata: Metadata = {
  title: "Dashboard | ByTe",
  description: "Your listings, appointments, and analytics at a glance.",
};

export default function DashboardHomePage() {
  return (
    <DashboardPageContainer>
      <DashboardPageHeader
        title="Dashboard"
        description="Your listings, appointments, and analytics at a glance."
      />
      <EmptyState
        title="Your dashboard is ready"
        description="Listings, appointments, and analytics will show up here as those modules ship over the coming phases."
      />
    </DashboardPageContainer>
  );
}
