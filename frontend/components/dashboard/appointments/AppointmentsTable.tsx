"use client";

import * as React from "react";
import {
  CalendarClock,
  Check,
  Clock,
  Home,
  MoreHorizontal,
} from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { AppointmentStatusBadge } from "@/components/dashboard/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { MOBILE_MEDIA_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatDateTime, formatTime } from "@/lib/formatters";
import {
  AppointmentActionPolicy,
  isOverdueAppointment,
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
  const allActions = AppointmentActionPolicy.getActions(appointment.status);
  // REQUESTED's only forward-moving action — surfaced as a direct button
  // (the same "promote the one obvious next step" treatment My Properties'
  // row Edit action got) since it's the single unambiguous "what do I do
  // next" answer for a fresh request. CONFIRMED/RESCHEDULED offer several
  // actions of comparable weight (Reschedule/Complete/No-show/Cancel), so
  // there's no one action to promote without second-guessing the developer's
  // workflow — those stay in the menu, ordered exactly as the policy returns.
  const confirmAction = allActions.find((action) => action.key === "CONFIRM");
  const menuActions = confirmAction
    ? allActions.filter((action) => action.key !== "CONFIRM")
    : allActions;

  return (
    <div className="flex items-center justify-end gap-1">
      {confirmAction && (
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label={`Confirm appointment with ${appointment.clientName}`}
          title="Confirm"
          onClick={() => onAction(appointment, confirmAction)}
        >
          <Check />
        </Button>
      )}
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
          {menuActions.length > 0 && <DropdownMenuSeparator />}
          {menuActions.map((action) => (
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
    </div>
  );
}

/**
 * Below `md` the 6-column table only fits ~2 columns on a phone, pushing
 * Status, the overdue flag and every action behind a horizontal scroll. This
 * renders the same appointments as a stacked card list instead — same date
 * grouping, same selection, same `RowActions` component (so
 * AppointmentActionPolicy stays the single source of truth for what a given
 * status may do), just laid out vertically.
 */
function AppointmentCards({
  groups,
  selectedIds,
  onToggleRow,
  onAction,
  onViewDetails,
  pendingIds,
}: {
  groups: { label: string; items: Appointment[] }[];
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onAction: (appointment: Appointment, action: AppointmentAction) => void;
  onViewDetails: (appointment: Appointment) => void;
  pendingIds: Set<string>;
}) {
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <section
          key={`group-${group.label}-${group.items[0]?.id}`}
          aria-label={group.label}
          className="flex flex-col gap-2"
        >
          <h3 className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
            <CalendarClock className="size-3.5" aria-hidden />
            {group.label}
          </h3>

          <ul className="flex flex-col gap-2">
            {group.items.map((appointment) => {
              const overdue = isOverdueAppointment(appointment, new Date());
              return (
                <li
                  key={appointment.id}
                  data-state={
                    selectedIds.has(appointment.id) ? "selected" : undefined
                  }
                  className="border-border data-[state=selected]:bg-muted/50 flex gap-3 rounded-lg border p-3"
                >
                  <Checkbox
                    checked={selectedIds.has(appointment.id)}
                    onChange={() => onToggleRow(appointment.id)}
                    aria-label={`Select appointment with ${appointment.clientName}`}
                    className="mt-1 shrink-0"
                  />

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {appointment.clientName}
                      </span>
                      <AppointmentStatusBadge status={appointment.status} />
                    </div>

                    <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                      <Home className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">
                        {appointment.propertyTitle}
                      </span>
                    </span>

                    <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className="sr-only">
                        {formatDateTime(appointment.scheduledFor)}
                        {overdue && " (overdue)"}
                      </span>
                      <span aria-hidden className="flex items-center gap-1.5">
                        <Clock className="size-3.5 shrink-0" aria-hidden />
                        {formatTime(appointment.scheduledFor)}
                      </span>
                      {overdue && (
                        <span
                          aria-hidden
                          className="text-destructive flex items-center gap-1 text-xs font-medium"
                        >
                          <CalendarClock className="size-3.5" aria-hidden />
                          Overdue
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="shrink-0">
                    <RowActions
                      appointment={appointment}
                      onAction={onAction}
                      onViewDetails={onViewDetails}
                      disabled={pendingIds.has(appointment.id)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

/**
 * The Appointments list: bulk-selectable rows grouped by scheduled date,
 * a status-aware action menu per row driven entirely by
 * AppointmentActionPolicy (so a policy change here can't drift from the bulk
 * toolbar's rules), loading skeleton, and both a true-empty and a
 * filtered-to-nothing empty state — mirrors ListingsTable.
 *
 * Renders a semantic table from `md` up and a card list below it. The two are
 * swapped in JS rather than with `hidden`/`md:` classes so only one exists in
 * the DOM at a time — otherwise every row's controls and accessible names
 * would be duplicated.
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
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY);

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

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {/* Visible text matches SelectAllCheckbox's own aria-label verbatim so
            the accessible name still contains the visible label (WCAG 2.5.3). */}
        <label className="text-muted-foreground flex items-center gap-2 text-sm">
          <SelectAllCheckbox
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onChange={onToggleAll}
          />
          Select all appointments on this page
        </label>
        <AppointmentCards
          groups={groups}
          selectedIds={selectedIds}
          onToggleRow={onToggleRow}
          onAction={onAction}
          onViewDetails={onViewDetails}
          pendingIds={pendingIds}
        />
      </div>
    );
  }

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
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="size-3.5" aria-hidden />
                  {group.label}
                </span>
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
                  <span className="flex items-center gap-1.5">
                    <Home
                      className="text-muted-foreground size-3.5 shrink-0"
                      aria-hidden
                    />
                    <span className="block max-w-[24ch] truncate">
                      {appointment.propertyTitle}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="sr-only">
                    {formatDateTime(appointment.scheduledFor)}
                    {isOverdueAppointment(appointment, new Date()) &&
                      " (overdue)"}
                  </span>
                  <span aria-hidden className="flex items-center gap-1.5">
                    <Clock className="size-3.5 shrink-0" aria-hidden />
                    {formatTime(appointment.scheduledFor)}
                    {isOverdueAppointment(appointment, new Date()) && (
                      <span className="text-destructive flex items-center gap-1 text-xs font-medium">
                        <CalendarClock className="size-3.5" aria-hidden />
                        Overdue
                      </span>
                    )}
                  </span>
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
