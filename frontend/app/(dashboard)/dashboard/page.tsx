import type { Metadata } from "next";

import { DashboardPageContainer } from "@/components/dashboard/DashboardPageContainer";
import { AppointmentOverview } from "@/components/dashboard/home/AppointmentOverview";
import { DashboardActionNeeded } from "@/components/dashboard/home/DashboardActionNeeded";
import { DashboardActivity } from "@/components/dashboard/home/DashboardActivity";
import { DashboardKpis } from "@/components/dashboard/home/DashboardKpis";
import { DashboardWelcome } from "@/components/dashboard/home/DashboardWelcome";
import { NotificationsPreview } from "@/components/dashboard/home/NotificationsPreview";
import { QuickActions } from "@/components/dashboard/home/QuickActions";
import { RecentListings } from "@/components/dashboard/home/RecentListings";
import { MotionReveal } from "@/components/motion";
import { APP_NAME } from "@/constants/config";

export const metadata: Metadata = {
  title: `Dashboard | ${APP_NAME}`,
  description: "Your listings, appointments, and analytics at a glance.",
};

/**
 * Developer Dashboard Home. A Server Component that lays out the grid and
 * composes the widgets; each widget is its own Client Component owning its
 * data fetch (through the services layer) and its loading/empty/error
 * state, so the shell never blocks on any one section.
 *
 * Ordered Understand → Manage → Act, per the Dashboard UX audit: context
 * (welcome + quick actions), what needs attention today, portfolio health,
 * then the operational detail (listings, appointments, notifications,
 * activity) a developer drills into once they know what to focus on.
 *
 * Each section gets its own mount/scroll reveal (not one shared stagger
 * container) since every widget fetches independently and settles at its
 * own pace — a single stagger would desync from when each one's data
 * actually resolves.
 */
export default function DashboardHomePage() {
  return (
    <DashboardPageContainer>
      <MotionReveal className="flex flex-col gap-4">
        <DashboardWelcome />
        <QuickActions />
      </MotionReveal>

      <MotionReveal>
        <DashboardActionNeeded />
      </MotionReveal>

      <MotionReveal>
        <DashboardKpis />
      </MotionReveal>

      <MotionReveal>
        <RecentListings />
      </MotionReveal>

      <MotionReveal className="grid gap-6 lg:grid-cols-2">
        <AppointmentOverview />
        <NotificationsPreview />
      </MotionReveal>

      <MotionReveal>
        <DashboardActivity />
      </MotionReveal>
    </DashboardPageContainer>
  );
}
