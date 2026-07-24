"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { AppointmentStatusBadge } from "@/components/dashboard/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/formatters";
import {
  AppointmentActionPolicy,
  type AppointmentAction,
} from "@/lib/appointmentActionPolicy";
import type { Appointment } from "@/types";

const COLUMN_COUNT = 6;

interface AppointmentsTableProps {
  appointments: Appointment[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  onAction: (appointment: Appointment, action: AppointmentAction) => void;
  onViewDetails: (appointment: Appointment) => void;
  /** Appointment IDs with a mutation currently in flight — disables that row's action menu. */
  pendingIds: Set<string>;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateGroupLabel(scheduledFor: string): string {
  const date = new Date(scheduledFor);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, now)) return "Today";
  if (isSameDay(date, tomorrow)) return "Tomorrow";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return formatDate(date);
}

/** Groups an already-sorted list into contiguous date buckets, preserving order. */
function groupByDate(
  appointments: Appointment[],
): { label: string; items: Appointment[] }[] {
  const groups: { label: string; items: Appointment[] }[] = [];

  for (const appointment of appointments) {
    const label = dateGroupLabel(appointment.scheduledFor);
    const lastGroup = groups.at(-1);
    if (lastGroup && lastGroup.label === label) {
      lastGroup.items.push(appointment);
    } else {
      groups.push({ label, items: [appointment] });
    }
  }

  return groups;
}

function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) {
  return (
    <input
      type="checkbox"
      ref={(node) => {
        if (node) node.indeterminate = indeterminate;
      }}
      checked={checked}
      onChange={onChange}
      aria-label="Select all appointments on this page"
      className="border-border accent-primary focus-visible:ring-ring/50 size-4 shrink-0 rounded-sm border focus-visible:ring-3 focus-visible:outline-none"
    />
  );
}

function RowActions({
  appointment,
  onAction,
  onViewDetails,
  disabled,
}: {
  appointment: Appointment;
  onAction: (appointment: Appointment, action: AppointmentAction) => void;
  onViewDetails: (appointment: Appointment) => void;
  disabled: boolean;
}) {
  const actions = AppointmentActionPolicy.getActions(appointment.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${appointment.clientName}`}
        disabled={disabled}
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewDetails(appointment)}>
          View details
        </DropdownMenuItem>
        {actions.length > 0 && <DropdownMenuSeparator />}
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.key}
            variant={action.key === "CANCEL" ? "destructive" : "default"}
            onClick={() => onAction(appointment, action)}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The Appointments table: bulk-selectable rows grouped by scheduled date,
 * a status-aware action menu per row driven entirely by
 * AppointmentActionPolicy (so a policy change here can't drift from the bulk
 * toolbar's rules), loading skeleton, and both a true-empty and a
 * filtered-to-nothing empty state — mirrors ListingsTable.
 */
export function AppointmentsTable({
  appointments,
  isLoading,
  isError,
  error,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onAction,
  onViewDetails,
  pendingIds,
  hasActiveFilters,
  onClearFilters,
}: AppointmentsTableProps) {
  if (isError) {
    return (
      <ErrorState
        title="Couldn't load your appointments."
        description={getErrorMessage(error)}
      />
    );
  }

  if (isLoading) {
    return <AppointmentsTableSkeleton />;
  }

  if (appointments.length === 0) {
    return hasActiveFilters ? (
      <EmptyState
        title="No appointments match your filters"
        description="Try adjusting or clearing your search and filters."
        action={
          <button
            type="button"
            onClick={onClearFilters}
            className="text-primary text-sm font-medium hover:underline"
          >
            Clear filters
          </button>
        }
      />
    ) : (
      <EmptyState
        title="No appointments yet"
        description="Viewing requests from prospective buyers and renters will appear here."
      />
    );
  }

  const allSelected =
    appointments.length > 0 &&
    appointments.every((item) => selectedIds.has(item.id));
  const someSelected = appointments.some((item) => selectedIds.has(item.id));
  const groups = groupByDate(appointments);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 px-4">
            <SelectAllCheckbox
              checked={allSelected}
              indeterminate={someSelected && !allSelected}
              onChange={onToggleAll}
            />
          </TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Property</TableHead>
          <TableHead>Scheduled for</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="px-4 text-right">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((group) => (
          <React.Fragment key={`group-${group.label}-${group.items[0]?.id}`}>
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={COLUMN_COUNT}
                className="bg-muted/40 text-muted-foreground px-4 py-1.5 text-xs font-medium"
              >
                {group.label}
              </TableCell>
            </TableRow>
            {group.items.map((appointment) => (
              <TableRow
                key={appointment.id}
                data-state={
                  selectedIds.has(appointment.id) ? "selected" : undefined
                }
              >
                <TableCell className="px-4">
                  <Checkbox
                    checked={selectedIds.has(appointment.id)}
                    onChange={() => onToggleRow(appointment.id)}
                    aria-label={`Select appointment with ${appointment.clientName}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {appointment.clientName}
                </TableCell>
                <TableCell>
                  <span className="block max-w-[28ch] truncate">
                    {appointment.propertyTitle}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(appointment.scheduledFor)}
                </TableCell>
                <TableCell>
                  <AppointmentStatusBadge status={appointment.status} />
                </TableCell>
                <TableCell className="px-4 text-right">
                  <RowActions
                    appointment={appointment}
                    onAction={onAction}
                    onViewDetails={onViewDetails}
                    disabled={pendingIds.has(appointment.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
}

function AppointmentsTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 px-4">
            <span className="sr-only">Select</span>
          </TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Property</TableHead>
          <TableHead>Scheduled for</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="px-4">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={COLUMN_COUNT} className="p-0">
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col gap-2 p-4"
            >
              <span className="sr-only">Loading appointments…</span>
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" aria-hidden />
              ))}
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
