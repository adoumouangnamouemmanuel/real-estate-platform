import type { Metadata } from "next";

import { DashboardPageContainer } from "@/components/dashboard/DashboardPageContainer";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { NotificationsView } from "@/components/dashboard/notifications/NotificationsView";
import {
  parseNotificationFilters,
  type RawNotificationSearchParams,
} from "@/lib/notificationFilters";

export const metadata: Metadata = {
  title: "Notifications | ByTe",
  description: "Review your latest updates across appointments and listings.",
};

interface NotificationsPageProps {
  searchParams: Promise<RawNotificationSearchParams>;
}

/**
 * Phase 6.6: the developer's notification inbox — filter by read state and
 * category, mark individual or all notifications as read, and open a
 * details drawer for the full body and a deep link back to the source.
 * Mirrors Appointments' page shell.
 */
export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const filters = parseNotificationFilters(await searchParams);

  return (
    <DashboardPageContainer>
      <DashboardPageHeader
        title="Notifications"
        description="Stay on top of appointment activity, listing changes, and account updates."
      />
      <NotificationsView filters={filters} />
    </DashboardPageContainer>
  );
}
