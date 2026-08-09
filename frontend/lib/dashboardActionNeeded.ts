import { isOverdueAppointment } from "@/lib/appointmentActionPolicy";
import { isStaleDraft, STALE_DRAFT_DAYS } from "@/lib/analyticsCalculations";
import { ROUTES } from "@/constants/routes";
import type { ActionNeededItem, Appointment, Property } from "@/types";

/** Matches the >=3 "high" severity threshold Analytics already uses for the identical OVERDUE_APPOINTMENTS/STALE_DRAFTS types. */
const HIGH_SEVERITY_COUNT = 3;

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/**
 * Dashboard Home's own "what needs my attention" — computed from the
 * dashboard's own dataset (services/mocks/dashboard.mock.ts), deliberately
 * independent from Analytics'/Appointments' own copies (ADR-011/012/014).
 * Reuses the *predicates* (isOverdueAppointment, isStaleDraft) and the >=3
 * "high" severity threshold from lib/appointmentActionPolicy.ts and
 * lib/analyticsCalculations.ts so the definition of "overdue"/"stale" can't
 * drift between surfaces — only the underlying rows differ, never the rule.
 *
 * Deliberately does not include a generic "N unread notifications" item —
 * that count already has two dedicated surfaces (the sidebar badge and the
 * Notifications panel itself); duplicating it here would be noise, not
 * signal, the same restraint Analytics' own buildActionNeeded applies by
 * only covering rates/counts nothing else already surfaces prominently.
 */
export function buildDashboardActionNeeded(
  properties: Property[],
  appointments: Appointment[],
  now: Date,
): ActionNeededItem[] {
  const items: ActionNeededItem[] = [];

  const requested = appointments.filter((a) => a.status === "REQUESTED");
  const overdue = requested.filter((a) => isOverdueAppointment(a, now));
  const newRequestCount = requested.length - overdue.length;

  if (overdue.length > 0) {
    items.push({
      type: "OVERDUE_APPOINTMENTS",
      severity: overdue.length >= HIGH_SEVERITY_COUNT ? "high" : "medium",
      title: plural(overdue.length, "overdue appointment request"),
      description:
        "These viewing requests are past their scheduled date with no response yet.",
      count: overdue.length,
      href: `${ROUTES.APPOINTMENTS}?timeframe=overdue`,
    });
  }

  if (newRequestCount > 0) {
    items.push({
      type: "NEW_APPOINTMENT_REQUESTS",
      severity: "medium",
      title: plural(newRequestCount, "new appointment request"),
      description: "Confirm or decline these viewing requests.",
      count: newRequestCount,
      href: `${ROUTES.APPOINTMENTS}?status=REQUESTED`,
    });
  }

  const staleDrafts = properties.filter(
    (property) => property.status === "DRAFT" && isStaleDraft(property, now),
  );
  if (staleDrafts.length > 0) {
    items.push({
      type: "STALE_DRAFTS",
      severity: staleDrafts.length >= HIGH_SEVERITY_COUNT ? "high" : "medium",
      title: plural(staleDrafts.length, "stale draft"),
      description: `No activity in ${STALE_DRAFT_DAYS}+ days — finish and publish, or archive.`,
      count: staleDrafts.length,
      href: `${ROUTES.LISTINGS}?status=DRAFT`,
    });
  }

  const suspended = properties.filter(
    (property) => property.status === "SUSPENDED",
  );
  if (suspended.length > 0) {
    items.push({
      type: "SUSPENDED_LISTINGS",
      severity: "medium",
      title: plural(suspended.length, "suspended listing"),
      description:
        "Suspended listings aren't visible to buyers — reactivate when you're ready.",
      count: suspended.length,
      href: `${ROUTES.LISTINGS}?status=SUSPENDED`,
    });
  }

  return items;
}
