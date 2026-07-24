import type { Metadata } from "next";

import { DashboardPageContainer } from "@/components/dashboard/DashboardPageContainer";
import { AppointmentOverview } from "@/components/dashboard/home/AppointmentOverview";
import { DashboardActivity } from "@/components/dashboard/home/DashboardActivity";
import { DashboardKpis } from "@/components/dashboard/home/DashboardKpis";
import { DashboardWelcome } from "@/components/dashboard/home/DashboardWelcome";
import { NotificationsPreview } from "@/components/dashboard/home/NotificationsPreview";
import { QuickActions } from "@/components/dashboard/home/QuickActions";
import { RecentListings } from "@/components/dashboard/home/RecentListings";

export const metadata: Metadata = {
  title: "Dashboard | ByTe",
  description: "Your listings, appointments, and analytics at a glance.",
};

/**
 * Developer Dashboard Home (Phase 6.1). A Server Component that lays out the
 * grid and composes the widgets; each widget is its own Client Component owning
 * its data fetch (through the services layer) and its loading/empty/error state,
 * so the shell never blocks on any one section.
 */
export default function DashboardHomePage() {
  return (
    <DashboardPageContainer>
      <DashboardWelcome />

      <DashboardKpis />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentListings />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AppointmentOverview />
        <NotificationsPreview />
      </div>

      <DashboardActivity />
    </DashboardPageContainer>
  );
}
