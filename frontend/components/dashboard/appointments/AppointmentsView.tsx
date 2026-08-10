"use client";

import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";

import { FilterChips } from "@/components/common/FilterChips";
import { Pagination } from "@/components/common/Pagination";
import { AppointmentDetailsDrawer } from "@/components/dashboard/appointments/AppointmentDetailsDrawer";
import { AppointmentsBulkActionsBar } from "@/components/dashboard/appointments/AppointmentsBulkActionsBar";
import { AppointmentsFilterBar } from "@/components/dashboard/appointments/AppointmentsFilterBar";
import { AppointmentsStatusSummary } from "@/components/dashboard/appointments/AppointmentsStatusSummary";
import { AppointmentsTable } from "@/components/dashboard/appointments/AppointmentsTable";
import { RescheduleDialog } from "@/components/dashboard/appointments/RescheduleDialog";
import { Button } from "@/components/ui/button";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import {
  useAppointments,
  useBulkUpdateAppointmentStatus,
  useRescheduleAppointment,
  useUpdateAppointmentStatus,
} from "@/hooks/useAppointments";
import type { AppointmentAction } from "@/lib/appointmentActionPolicy";
import { buildAppointmentFilterChips } from "@/lib/appointmentFilters";
import type { GetAppointmentsParams } from "@/services";
import type { Appointment, AppointmentStatus } from "@/types";

interface AppointmentsViewProps {
  filters: GetAppointmentsParams;
}

/**
 * A quiet, one-line "these need a response" prompt for the URGENT tier of the
 * page's information hierarchy — reuses the existing `timeframe=overdue`
 * filter (already backed by `isOverdueAppointment`, see appointment.service.ts)
 * rather than computing overdue-ness a second time here. Hides itself once
 * the developer is already looking at the overdue view, or once there's
 * nothing overdue.
 */
function OverdueBanner({
  isActive,
  onView,
}: {
  isActive: boolean;
  onView: () => void;
}) {
  const { data } = useAppointments({ timeframe: "overdue", pageSize: 1 });
  const count = data?.total ?? 0;

  if (isActive || count === 0) return null;

  return (
    <div className="border-destructive/30 bg-destructive/5 flex items-center gap-3 rounded-lg border p-3">
      <CalendarClock className="text-destructive size-5 shrink-0" aria-hidden />
      <p className="flex-1 text-sm">
        <span className="font-medium">
          {count} viewing request{count === 1 ? "" : "s"}
        </span>{" "}
        past their scheduled date with no response yet.
      </p>
      <Button variant="outline" size="sm" onClick={onView}>
        View overdue
      </Button>
    </div>
  );
}

/**
 * Orchestrates the Appointments page: URL-driven filters/pagination (mirroring
 * ListingsView), page-scoped row selection, the lifecycle mutations, the
 * details drawer, and the reschedule dialog shared by the row menu, the bulk
 * bar (Confirm/Cancel only), and the drawer's own action buttons.
 */
export function AppointmentsView({ filters }: AppointmentsViewProps) {
  const { data, isLoading, isError, error } = useAppointments(filters);
  const updateParams = useFilterNavigation<GetAppointmentsParams>();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);

  // Derived from the live query result by id, not stored as a snapshot —
  // otherwise an open drawer/dialog would keep showing the appointment's
  // status/date as they were at click time even after a refetch (e.g. another
  // mutation invalidating this query) brought back newer data.
  const detailsTarget = useMemo(
    () => data?.items.find((item) => item.id === detailsId) ?? null,
    [data, detailsId],
  );
  const rescheduleTarget = useMemo(
    () => data?.items.find((item) => item.id === rescheduleId) ?? null,
    [data, rescheduleId],
  );
  const selectedStatuses = useMemo(
    () =>
      (data?.items ?? [])
        .filter((item) => selectedIds.has(item.id))
        .map((item) => item.status),
    [data, selectedIds],
  );

  const updateStatus = useUpdateAppointmentStatus();
  const reschedule = useRescheduleAppointment();
  const bulkUpdateStatus = useBulkUpdateAppointmentStatus();

  const pendingIds = new Set<string>();
  if (updateStatus.isPending && updateStatus.variables) {
    pendingIds.add(updateStatus.variables.id);
  }
  if (reschedule.isPending && reschedule.variables) {
    pendingIds.add(reschedule.variables.id);
  }
  if (bulkUpdateStatus.isPending) {
    bulkUpdateStatus.variables?.ids.forEach((id) => pendingIds.add(id));
  }

  function handleFilterChange(partial: Partial<GetAppointmentsParams>) {
    setSelectedIds(new Set());
    updateParams({ ...filters, ...partial, page: 1 });
  }

  function handleRemoveFilter(key: keyof GetAppointmentsParams) {
    handleFilterChange({ [key]: undefined });
  }

  function handlePageChange(page: number) {
    setSelectedIds(new Set());
    updateParams({ ...filters, page });
  }

  function handleToggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleToggleAll() {
    const pageIds = data?.items.map((item) => item.id) ?? [];
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds(allSelected ? new Set() : new Set(pageIds));
  }

  function handleAction(appointment: Appointment, action: AppointmentAction) {
    if (action.key === "RESCHEDULE") {
      setRescheduleId(appointment.id);
      return;
    }
    updateStatus.mutate({ id: appointment.id, status: action.target! });
  }

  function handleBulkStatus(status: AppointmentStatus) {
    bulkUpdateStatus.mutate(
      { ids: Array.from(selectedIds), status },
      { onSuccess: () => setSelectedIds(new Set()) },
    );
  }

  function handleConfirmReschedule(scheduledFor: string) {
    if (!rescheduleTarget) return;
    reschedule.mutate(
      { id: rescheduleTarget.id, scheduledFor },
      { onSuccess: () => setRescheduleId(null) },
    );
  }

  const hasActiveFilters = Boolean(
    filters.q || filters.status || filters.timeframe,
  );

  return (
    <div className="flex flex-col gap-6">
      <OverdueBanner
        isActive={filters.timeframe === "overdue"}
        onView={() => handleFilterChange({ timeframe: "overdue" })}
      />

      <AppointmentsStatusSummary
        activeStatus={filters.status}
        onSelectStatus={(status) => handleFilterChange({ status })}
      />

      <AppointmentsFilterBar filters={filters} onApply={handleFilterChange} />
      <FilterChips
        chips={buildAppointmentFilterChips(filters)}
        onRemove={handleRemoveFilter}
      />

      <AppointmentsBulkActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkStatus={handleBulkStatus}
        isPending={bulkUpdateStatus.isPending}
        selectedStatuses={selectedStatuses}
      />

      <AppointmentsTable
        appointments={data?.items ?? []}
        isLoading={isLoading}
        isError={isError}
        error={error}
        selectedIds={selectedIds}
        onToggleRow={handleToggleRow}
        onToggleAll={handleToggleAll}
        onAction={handleAction}
        onViewDetails={(appointment) => setDetailsId(appointment.id)}
        pendingIds={pendingIds}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() =>
          handleFilterChange({
            q: undefined,
            status: undefined,
            timeframe: undefined,
          })
        }
      />

      {data && data.totalPages > 1 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <AppointmentDetailsDrawer
        appointment={detailsTarget}
        onOpenChange={(open) => {
          if (!open) setDetailsId(null);
        }}
        onAction={(appointment, action) => {
          setDetailsId(null);
          handleAction(appointment, action);
        }}
        isPending={updateStatus.isPending || reschedule.isPending}
      />

      <RescheduleDialog
        appointment={rescheduleTarget}
        onOpenChange={(open) => {
          if (!open) setRescheduleId(null);
        }}
        onConfirm={handleConfirmReschedule}
        isPending={reschedule.isPending}
      />
    </div>
  );
}
