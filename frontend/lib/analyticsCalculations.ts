import { isOverdueAppointment } from "@/lib/appointmentActionPolicy";
import { PROPERTY_CATEGORIES } from "@/constants/categories";
import { ROUTES } from "@/constants/routes";
import type {
  ActionNeededItem,
  AnalyticsPeriod,
  AnalyticsStat,
  Appointment,
  AppointmentFunnel,
  AppointmentStatus,
  PortfolioComposition,
  Property,
  PropertyStatus,
} from "@/types";

/**
 * Pure business logic for the Analytics domain — no service calls, no React,
 * no formatting. Every function here takes plain domain arrays (the same
 * `Appointment[]`/`Property[]` shapes `appointmentService`/`listingService`
 * already return) and a few primitives, and returns a plain value. This is
 * what `analyticsService` calls and what unit tests exercise directly,
 * without a mock latency delay or a React Query wrapper in the way.
 */

const PERIOD_DAYS: Record<AnalyticsPeriod, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/** Stale draft threshold — a draft untouched this long shows up in Action Needed. Not user-configurable today; revisit if that's ever requested. */
/** Exported so Dashboard Home's own Action Needed (lib/dashboardActionNeeded.ts) can't define "stale" differently. */
export const STALE_DRAFT_DAYS = 5;

/** Minimum requested-cohort size before a cancellation rate is trustworthy enough to flag — otherwise "1 of 2 cancelled" reads as a 50% crisis. */
const MIN_SAMPLE_FOR_CANCELLATION_FLAG = 5;
const HIGH_CANCELLATION_RATE = 0.35;
const MEDIUM_CANCELLATION_RATE = 0.2;

const PROPERTY_STATUS_ORDER: PropertyStatus[] = [
  "ACTIVE",
  "RESERVED",
  "SOLD",
  "DRAFT",
  "SUSPENDED",
];

const APPOINTMENT_STATUS_ORDER: AppointmentStatus[] = [
  "REQUESTED",
  "CONFIRMED",
  "RESCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

export function getPeriodStart(period: AnalyticsPeriod, now: Date): Date {
  const start = new Date(now);
  start.setDate(start.getDate() - PERIOD_DAYS[period]);
  return start;
}

type TrackedActivityType =
  "APPOINTMENT_REQUESTED" | "APPOINTMENT_CONFIRMED" | "APPOINTMENT_COMPLETED";

function historyTimestamp(
  appointment: Appointment,
  type: TrackedActivityType,
): Date | null {
  const entry = appointment.history?.find((item) => item.type === type);
  return entry ? new Date(entry.timestamp) : null;
}

/** An appointment belongs to a period's cohort if it was requested within that window — "of everyone who asked in this window, what happened to them." Appointments with no recorded request timestamp are excluded rather than guessed at. */
function isInPeriodCohort(
  appointment: Appointment,
  periodStart: Date,
  now: Date,
): boolean {
  const requestedAt = historyTimestamp(appointment, "APPOINTMENT_REQUESTED");
  if (!requestedAt) return false;
  return (
    requestedAt.getTime() >= periodStart.getTime() &&
    requestedAt.getTime() <= now.getTime()
  );
}

/**
 * The appointment lifecycle as a conversion funnel over a period's cohort.
 * Every rate is computed defensively (0, not NaN/Infinity) when its
 * denominator is empty — an empty period is "no data," not a division error.
 */
export function buildAppointmentFunnel(
  appointments: Appointment[],
  period: AnalyticsPeriod,
  now: Date,
): AppointmentFunnel {
  const periodStart = getPeriodStart(period, now);
  const cohort = appointments.filter((appointment) =>
    isInPeriodCohort(appointment, periodStart, now),
  );

  const countByStatus = (status: AppointmentStatus) =>
    cohort.filter((appointment) => appointment.status === status).length;

  const stages = APPOINTMENT_STATUS_ORDER.map((status) => ({
    status,
    count: countByStatus(status),
  }));

  const totalRequested = cohort.length;
  const acted = cohort.filter(
    (appointment) => appointment.status !== "REQUESTED",
  ).length;
  const cancelled = countByStatus("CANCELLED");
  const noShow = countByStatus("NO_SHOW");
  const completed = countByStatus("COMPLETED");
  const onTheBooksOrBeyond =
    countByStatus("CONFIRMED") +
    countByStatus("RESCHEDULED") +
    completed +
    noShow;

  const responseTimes: number[] = [];
  for (const appointment of cohort) {
    const requestedAt = historyTimestamp(appointment, "APPOINTMENT_REQUESTED");
    const confirmedAt = historyTimestamp(appointment, "APPOINTMENT_CONFIRMED");
    if (requestedAt && confirmedAt) {
      responseTimes.push(
        (confirmedAt.getTime() - requestedAt.getTime()) / (1000 * 60 * 60),
      );
    }
  }

  return {
    period,
    stages,
    totalRequested,
    responseRate: totalRequested === 0 ? 0 : acted / totalRequested,
    completionRate:
      onTheBooksOrBeyond === 0 ? 0 : completed / onTheBooksOrBeyond,
    cancellationRate: totalRequested === 0 ? 0 : cancelled / totalRequested,
    noShowRate: totalRequested === 0 ? 0 : noShow / totalRequested,
    averageResponseHours:
      responseTimes.length === 0
        ? null
        : responseTimes.reduce((sum, hours) => sum + hours, 0) /
          responseTimes.length,
  };
}

/** Current-state portfolio composition — never period-filtered, since "what do I have right now" has no date range. */
export function buildPortfolioComposition(
  properties: Property[],
): PortfolioComposition {
  const byStatus = PROPERTY_STATUS_ORDER.map((status) => ({
    status,
    count: properties.filter((property) => property.status === status).length,
  }));

  const byCategory = PROPERTY_CATEGORIES.map(({ value: category }) => ({
    category,
    count: properties.filter((property) => property.category === category)
      .length,
  }));

  return {
    totalListings: properties.length,
    byStatus,
    byCategory,
  };
}

export function isStaleDraft(property: Property, now: Date): boolean {
  if (property.status !== "DRAFT" || !property.updatedAt) return false;
  const ageMs = now.getTime() - new Date(property.updatedAt).getTime();
  return ageMs > STALE_DRAFT_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * "What needs my attention right now" — always current-state, never
 * period-filtered (unlike the funnel/stats, which respect the period
 * selector). Every item deep-links straight into the already-filtered view
 * that resolves it — this is a first-class feature, not a decorative banner.
 */
export function buildActionNeeded(
  appointments: Appointment[],
  properties: Property[],
  funnel: AppointmentFunnel,
  now: Date,
): ActionNeededItem[] {
  const items: ActionNeededItem[] = [];

  const overdueCount = appointments.filter((appointment) =>
    isOverdueAppointment(appointment, now),
  ).length;
  if (overdueCount > 0) {
    items.push({
      type: "OVERDUE_APPOINTMENTS",
      severity: overdueCount >= 3 ? "high" : "medium",
      title: `${overdueCount} overdue appointment request${overdueCount === 1 ? "" : "s"}`,
      description:
        "These viewing requests are past their scheduled date with no response yet.",
      count: overdueCount,
      href: `${ROUTES.APPOINTMENTS}?timeframe=overdue`,
    });
  }

  const staleDraftCount = properties.filter((property) =>
    isStaleDraft(property, now),
  ).length;
  if (staleDraftCount > 0) {
    items.push({
      type: "STALE_DRAFTS",
      severity: staleDraftCount >= 3 ? "high" : "medium",
      title: `${staleDraftCount} stale draft${staleDraftCount === 1 ? "" : "s"}`,
      description: `No activity in ${STALE_DRAFT_DAYS}+ days — finish and publish, or archive.`,
      count: staleDraftCount,
      href: `${ROUTES.LISTINGS}?status=DRAFT`,
    });
  }

  if (
    funnel.totalRequested >= MIN_SAMPLE_FOR_CANCELLATION_FLAG &&
    funnel.cancellationRate >= MEDIUM_CANCELLATION_RATE
  ) {
    const cancelledCount = Math.round(
      funnel.cancellationRate * funnel.totalRequested,
    );
    items.push({
      type: "HIGH_CANCELLATION_RATE",
      severity:
        funnel.cancellationRate >= HIGH_CANCELLATION_RATE ? "high" : "medium",
      title: `${Math.round(funnel.cancellationRate * 100)}% cancellation rate this period`,
      description: `${cancelledCount} of ${funnel.totalRequested} requested appointments were cancelled.`,
      count: cancelledCount,
      href: `${ROUTES.APPOINTMENTS}?status=CANCELLED`,
    });
  }

  return items;
}

/** One data point per day in the period, oldest first — a real series derived from `history` timestamps, never interpolated to "look complete" for days with no events. */
function dailyEventCounts(
  appointments: Appointment[],
  type: "APPOINTMENT_CONFIRMED" | "APPOINTMENT_COMPLETED",
  period: AnalyticsPeriod,
  now: Date,
): number[] {
  const days = PERIOD_DAYS[period];
  const counts = new Array(days).fill(0) as number[];

  for (const appointment of appointments) {
    const timestamp = historyTimestamp(appointment, type);
    if (!timestamp) continue;
    const dayIndex =
      days -
      1 -
      Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24));
    if (dayIndex >= 0 && dayIndex < days) {
      counts[dayIndex] += 1;
    }
  }

  return counts;
}

/**
 * The StatCard row's headline numbers. Trends are only attached where the
 * underlying series is a real day-by-day event count (confirmations,
 * completions) — rates and portfolio counts get a number with no sparkline
 * rather than a fabricated-looking flat line.
 */
export function buildAnalyticsStats(
  appointments: Appointment[],
  portfolio: PortfolioComposition,
  funnel: AppointmentFunnel,
  period: AnalyticsPeriod,
  now: Date,
): AnalyticsStat[] {
  const activeListings =
    portfolio.byStatus.find((entry) => entry.status === "ACTIVE")?.count ?? 0;

  return [
    {
      key: "active_listings",
      label: "Active Listings",
      value: activeListings,
      format: "number",
      hint: `${portfolio.totalListings} total`,
    },
    {
      key: "response_rate",
      label: "Response Rate",
      value: Math.round(funnel.responseRate * 100),
      format: "percent",
      hint: `${funnel.totalRequested} requested this period`,
    },
    {
      key: "completed_viewings",
      label: "Completed Viewings",
      value:
        funnel.stages.find((stage) => stage.status === "COMPLETED")?.count ?? 0,
      format: "number",
      trend: dailyEventCounts(
        appointments,
        "APPOINTMENT_COMPLETED",
        period,
        now,
      ),
      hint: "This period",
    },
    {
      key: "cancellation_rate",
      label: "Cancellation Rate",
      value: Math.round(funnel.cancellationRate * 100),
      format: "percent",
      hint: `${funnel.stages.find((stage) => stage.status === "CANCELLED")?.count ?? 0} cancelled`,
    },
  ];
}
