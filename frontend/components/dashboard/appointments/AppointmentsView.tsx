"use client";

import { useState } from "react";

import { FilterChips } from "@/components/common/FilterChips";
import { Pagination } from "@/components/common/Pagination";
import { AppointmentDetailsDrawer } from "@/components/dashboard/appointments/AppointmentDetailsDrawer";
import { AppointmentsBulkActionsBar } from "@/components/dashboard/appointments/AppointmentsBulkActionsBar";
import { AppointmentsFilterBar } from "@/components/dashboard/appointments/AppointmentsFilterBar";
import { AppointmentsStatusSummary } from "@/components/dashboard/appointments/AppointmentsStatusSummary";
import { AppointmentsTable } from "@/components/dashboard/appointments/AppointmentsTable";
import { RescheduleDialog } from "@/components/dashboard/appointments/RescheduleDialog";
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
 * Orchestrates the Appointments page: URL-driven filters/pagination (mirroring
 * ListingsView), page-scoped row selection, the lifecycle mutations, the
 * details drawer, and the reschedule dialog shared by the row menu, the bulk
 * bar (Confirm/Cancel only), and the drawer's own action buttons.
 */
export function AppointmentsView({ filters }: AppointmentsViewProps) {
  const { data, isLoading, isError, error } = useAppointments(filters);
  const updateParams = useFilterNavigation<GetAppointmentsParams>();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailsTarget, setDetailsTarget] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(
    null,
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
      setRescheduleTarget(appointment);
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
      { onSuccess: () => setRescheduleTarget(null) },
    );
  }

  const hasActiveFilters = Boolean(
    filters.q || filters.status || filters.timeframe,
  );

  return (
    <div className="flex flex-col gap-6">
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
        onViewDetails={setDetailsTarget}
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
          if (!open) setDetailsTarget(null);
        }}
        onAction={(appointment, action) => {
          setDetailsTarget(null);
          handleAction(appointment, action);
        }}
        isPending={updateStatus.isPending || reschedule.isPending}
      />

      <RescheduleDialog
        appointment={rescheduleTarget}
        onOpenChange={(open) => {
          if (!open) setRescheduleTarget(null);
        }}
        onConfirm={handleConfirmReschedule}
        isPending={reschedule.isPending}
      />
    </div>
  );
}
