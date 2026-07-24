import { AppointmentActionPolicy } from "@/lib/appointmentActionPolicy";
import { trackAppointmentEvent } from "@/lib/telemetry";
import type {
  ActivityItem,
  ActivityType,
  Appointment,
  AppointmentStatus,
  PaginatedResult,
} from "@/types";

import { MOCK_APPOINTMENTS } from "./mocks/appointments.mock";

const DEFAULT_PAGE_SIZE = 10;
const MOCK_LATENCY_MS = 400;

export type AppointmentSort = "date_asc" | "date_desc";

/** "today"/"upcoming"/"overdue" read against `scheduledFor` and are only meaningful for non-terminal statuses — a completed or cancelled appointment from last week isn't "overdue". */
export type AppointmentTimeframe = "today" | "upcoming" | "overdue";

export interface AppointmentFilters {
  q?: string;
  status?: AppointmentStatus;
  timeframe?: AppointmentTimeframe;
  sort?: AppointmentSort;
}

export interface GetAppointmentsParams extends AppointmentFilters {
  page?: number;
  pageSize?: number;
}

export type AppointmentStatusCounts = Record<AppointmentStatus, number>;

function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  };
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function matchesTimeframe(
  item: Appointment,
  timeframe: AppointmentTimeframe,
): boolean {
  const scheduledFor = new Date(item.scheduledFor);
  const now = new Date();

  if (timeframe === "today") return isSameDay(scheduledFor, now);
  if (timeframe === "upcoming") return scheduledFor.getTime() > now.getTime();

  // overdue: still awaiting action but the visit date has already passed
  return (
    scheduledFor.getTime() < now.getTime() &&
    !AppointmentActionPolicy.isTerminal(item.status) &&
    item.status !== "CONFIRMED" &&
    item.status !== "RESCHEDULED"
  );
}

function filterAppointments(
  items: Appointment[],
  filters: AppointmentFilters,
): Appointment[] {
  return items.filter((item) => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.timeframe && !matchesTimeframe(item, filters.timeframe))
      return false;

    if (filters.q) {
      const haystack = `${item.clientName} ${item.propertyTitle}`.toLowerCase();
      if (!haystack.includes(filters.q.toLowerCase())) return false;
    }

    return true;
  });
}

function sortAppointments(
  items: Appointment[],
  sort: AppointmentSort = "date_asc",
): Appointment[] {
  const byDateAsc = (a: Appointment, b: Appointment) =>
    new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();

  if (sort === "date_desc") return [...items].sort((a, b) => -byDateAsc(a, b));
  return [...items].sort(byDateAsc);
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(value), MOCK_LATENCY_MS),
  );
}

function findAppointmentOrThrow(id: string): Appointment {
  const appointment = MOCK_APPOINTMENTS.find((item) => item.id === id);
  if (!appointment) throw new Error("Appointment not found");
  return appointment;
}

const HISTORY_EVENT_BY_STATUS: Record<AppointmentStatus, ActivityType> = {
  REQUESTED: "APPOINTMENT_REQUESTED",
  CONFIRMED: "APPOINTMENT_CONFIRMED",
  RESCHEDULED: "APPOINTMENT_RESCHEDULED",
  COMPLETED: "APPOINTMENT_COMPLETED",
  CANCELLED: "APPOINTMENT_CANCELLED",
  NO_SHOW: "APPOINTMENT_NO_SHOW",
};

const HISTORY_MESSAGE_BY_STATUS: Record<AppointmentStatus, string> = {
  REQUESTED: "Viewing requested.",
  CONFIRMED: "You confirmed the viewing.",
  RESCHEDULED: "You rescheduled the viewing.",
  COMPLETED: "Viewing marked complete.",
  CANCELLED: "You cancelled the request.",
  NO_SHOW: "Client did not show up.",
};

function appendHistory(appointment: Appointment, status: AppointmentStatus) {
  const entry: ActivityItem = {
    id: crypto.randomUUID(),
    type: HISTORY_EVENT_BY_STATUS[status],
    message: HISTORY_MESSAGE_BY_STATUS[status],
    timestamp: new Date().toISOString(),
  };
  appointment.history = [...(appointment.history ?? []), entry];
}

function applyStatusChange(
  appointment: Appointment,
  status: AppointmentStatus,
) {
  appointment.status = status;
  appendHistory(appointment, status);

  if (status === "CONFIRMED") {
    trackAppointmentEvent({
      name: "appointment_confirmed",
      appointmentId: appointment.id,
    });
  } else if (status === "COMPLETED") {
    trackAppointmentEvent({
      name: "appointment_completed",
      appointmentId: appointment.id,
    });
  } else if (status === "CANCELLED") {
    trackAppointmentEvent({
      name: "appointment_cancelled",
      appointmentId: appointment.id,
      from: appointment.status,
    });
  } else if (status === "NO_SHOW") {
    trackAppointmentEvent({
      name: "appointment_no_show",
      appointmentId: appointment.id,
    });
  }
}

/**
 * The developer's appointment book — filtering, sorting, pagination, and the
 * lifecycle mutations the Appointments page and its details drawer need.
 * Deliberately independent from `dashboard.service.ts`'s `getAppointmentOverview`
 * (Phase 6.1, already shipped): same reasoning as MOCK_LISTINGS vs
 * MOCK_DASHBOARD_LISTINGS (ADR-011/012) — a real backend would serve both
 * from one table, but this phase doesn't touch the reviewed widget's data.
 * Every mutation routes status changes through `AppointmentActionPolicy` so
 * the service can never apply a transition the UI wouldn't have offered.
 * TODO(backend): replace every method with GET/PATCH
 * /api/v1/developers/me/appointments once it exists.
 */
export const appointmentService = {
  getAppointments: ({
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    ...filters
  }: GetAppointmentsParams = {}): Promise<PaginatedResult<Appointment>> => {
    const results = sortAppointments(
      filterAppointments(MOCK_APPOINTMENTS, filters),
      filters.sort,
    );
    return delay(paginate(results, page, pageSize));
  },

  getStatusCounts: (): Promise<AppointmentStatusCounts> => {
    const counts: AppointmentStatusCounts = {
      REQUESTED: 0,
      CONFIRMED: 0,
      RESCHEDULED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      NO_SHOW: 0,
    };
    for (const item of MOCK_APPOINTMENTS) counts[item.status] += 1;
    return delay(counts);
  },

  getAppointment: (id: string): Promise<Appointment> => {
    const appointment = MOCK_APPOINTMENTS.find((item) => item.id === id);
    return appointment
      ? delay(appointment)
      : Promise.reject(new Error("Appointment not found"));
  },

  /**
   * `async` (not a plain arrow returning a Promise) so that
   * `findAppointmentOrThrow`'s synchronous throw on an unknown id becomes a
   * proper rejected promise instead of an exception thrown at call time —
   * the same bug class `notification.service.ts`'s `markAsRead` had (see
   * ADR-015); fixed here for the same reason, with the same regression test.
   */
  updateStatus: async (
    id: string,
    status: AppointmentStatus,
  ): Promise<Appointment> => {
    const appointment = findAppointmentOrThrow(id);
    if (
      !AppointmentActionPolicy.isValidTransition(appointment.status, status)
    ) {
      return Promise.reject(
        new Error(
          `Cannot move an appointment from ${appointment.status} to ${status}.`,
        ),
      );
    }
    applyStatusChange(appointment, status);
    return delay(appointment);
  },

  /**
   * Rescheduling always lands the appointment in RESCHEDULED, regardless of
   * prior status (REQUESTED/CONFIRMED) — the new date is proposed by the
   * developer either way. `async` for the same reason as `updateStatus`.
   */
  reschedule: async (
    id: string,
    scheduledFor: string,
  ): Promise<Appointment> => {
    const appointment = findAppointmentOrThrow(id);
    if (AppointmentActionPolicy.isTerminal(appointment.status)) {
      return Promise.reject(
        new Error(
          `A ${appointment.status.toLowerCase()} appointment can't be rescheduled.`,
        ),
      );
    }

    const previousScheduledFor = appointment.scheduledFor;
    appointment.previousScheduledFor = previousScheduledFor;
    appointment.scheduledFor = scheduledFor;
    appointment.status = "RESCHEDULED";
    appendHistory(appointment, "RESCHEDULED");
    trackAppointmentEvent({
      name: "appointment_rescheduled",
      appointmentId: appointment.id,
      from: previousScheduledFor,
      to: scheduledFor,
    });

    return delay(appointment);
  },

  /**
   * Restricted to bulk-safe actions (Confirm/Cancel) at the policy layer — see
   * `AppointmentActionPolicy.getBulkActions`. Applies to whichever selected
   * appointments the transition is actually valid for and silently skips the
   * rest, same idiom as `listingService.bulkUpdateStatus`.
   */
  bulkUpdateStatus: (
    ids: string[],
    status: AppointmentStatus,
  ): Promise<{ updated: string[]; skipped: string[] }> => {
    const updated: string[] = [];
    const skipped: string[] = [];

    for (const id of ids) {
      const appointment = MOCK_APPOINTMENTS.find((item) => item.id === id);
      if (
        appointment &&
        AppointmentActionPolicy.isValidTransition(appointment.status, status)
      ) {
        applyStatusChange(appointment, status);
        updated.push(id);
      } else {
        skipped.push(id);
      }
    }

    return delay({ updated, skipped });
  },
};
