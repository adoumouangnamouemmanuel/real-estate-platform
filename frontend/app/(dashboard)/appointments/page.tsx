import type { Metadata } from "next";

import { AppointmentsView } from "@/components/dashboard/appointments/AppointmentsView";
import { DashboardPageContainer } from "@/components/dashboard/DashboardPageContainer";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  parseAppointmentFilters,
  type RawAppointmentSearchParams,
} from "@/lib/appointmentFilters";

export const metadata: Metadata = {
  title: "Appointments | ByTe",
  description: "Manage viewing requests and appointments.",
};

interface AppointmentsPageProps {
  searchParams: Promise<RawAppointmentSearchParams>;
}

/**
 * Phase 6.4: the developer's appointment book — search, filter, sort,
 * pagination, per-appointment lifecycle actions, safe bulk actions, and a
 * details drawer with the full history. Mirrors My Properties' page shell.
 */
export default async function AppointmentsPage({
  searchParams,
}: AppointmentsPageProps) {
  const filters = parseAppointmentFilters(await searchParams);

  return (
    <DashboardPageContainer>
      <DashboardPageHeader
        title="Appointments"
        description="Review viewing requests, confirm bookings, and track your appointment history."
      />
      <AppointmentsView filters={filters} />
    </DashboardPageContainer>
  );
}
