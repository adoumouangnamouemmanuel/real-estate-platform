"use client";

import { CalendarCheck } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { AppointmentStatusBadge } from "@/components/dashboard/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppointmentOverview } from "@/hooks/useDashboard";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";
import type { Appointment } from "@/types";

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  return (
    <li className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate text-sm font-medium">
          {appointment.propertyTitle}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {appointment.clientName}
        </p>
        <p className="text-muted-foreground text-xs">
          <time
            dateTime={appointment.scheduledFor}
            title={formatDateTime(appointment.scheduledFor)}
          >
            {formatDateTime(appointment.scheduledFor)}
          </time>{" "}
          · {formatRelativeTime(appointment.scheduledFor)}
        </p>
      </div>
      <AppointmentStatusBadge status={appointment.status} />
    </li>
  );
}

function AppointmentList({
  appointments,
  emptyMessage,
}: {
  appointments: Appointment[];
  emptyMessage: string;
}) {
  if (appointments.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <ul className="divide-border flex flex-col divide-y">
      {appointments.map((appointment) => (
        <AppointmentRow key={appointment.id} appointment={appointment} />
      ))}
    </ul>
  );
}

/** Upcoming, requested, and recently completed appointments, split across tabs. */
export function AppointmentOverview() {
  const { data, isLoading, isError } = useAppointmentOverview();

  return (
    <DashboardSection
      title="Appointments"
      description="Viewings across your listings."
      icon={CalendarCheck}
    >
      {isError ? (
        <ErrorState
          title="Couldn't load your appointments."
          description="Please refresh the page to try again."
        />
      ) : isLoading || !data ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="upcoming" className="gap-4">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({data.upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="requested">
              Requested ({data.requested.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({data.completed.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming">
            <AppointmentList
              appointments={data.upcoming}
              emptyMessage="No upcoming appointments."
            />
          </TabsContent>
          <TabsContent value="requested">
            <AppointmentList
              appointments={data.requested}
              emptyMessage="No pending visit requests."
            />
          </TabsContent>
          <TabsContent value="completed">
            <AppointmentList
              appointments={data.completed}
              emptyMessage="No completed appointments yet."
            />
          </TabsContent>
        </Tabs>
      )}
    </DashboardSection>
  );
}
