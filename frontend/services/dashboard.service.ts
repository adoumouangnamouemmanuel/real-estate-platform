import type {
  ActivityItem,
  AppointmentOverview,
  DashboardMetrics,
  DashboardSummary,
  Notification,
  Property,
} from "@/types";

import {
  MOCK_ACTIVITY,
  MOCK_APPOINTMENTS,
  MOCK_DASHBOARD_LISTINGS,
  MOCK_DASHBOARD_SUMMARY,
  MOCK_NOTIFICATIONS,
} from "./mocks/dashboard.mock";

const MOCK_LATENCY_MS = 400;

/** A steady headline number for "total views" — not derivable from the mock listings. */
const MOCK_TOTAL_PROPERTY_VIEWS = 3742;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(value), MOCK_LATENCY_MS),
  );
}

/**
 * The developer dashboard's data seam. Every method mirrors one future endpoint
 * (see the TODO(backend) notes in mocks/dashboard.mock.ts); the components and
 * hooks that consume these never touch a mock or Axios directly, so wiring the
 * real backend is a change here and nowhere else — same contract as
 * propertyService/developerService.
 */
export const dashboardService = {
  getSummary: (): Promise<DashboardSummary> => delay(MOCK_DASHBOARD_SUMMARY),

  getMetrics: (): Promise<DashboardMetrics> => {
    const listings = MOCK_DASHBOARD_LISTINGS;
    return delay({
      totalProperties: listings.length,
      activeListings: listings.filter((l) => l.status === "ACTIVE").length,
      draftListings: listings.filter((l) => l.status === "DRAFT").length,
      appointmentRequests: MOCK_APPOINTMENTS.filter(
        (a) => a.status === "REQUESTED",
      ).length,
      unreadNotifications: MOCK_NOTIFICATIONS.filter(
        (n) => n.status === "UNREAD",
      ).length,
      totalPropertyViews: MOCK_TOTAL_PROPERTY_VIEWS,
    });
  },

  getRecentListings: (limit = 5): Promise<Property[]> =>
    delay(MOCK_DASHBOARD_LISTINGS.slice(0, limit)),

  getAppointmentOverview: (): Promise<AppointmentOverview> => {
    const bySoonest = (
      a: { scheduledFor: string },
      b: { scheduledFor: string },
    ) =>
      new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
    const byMostRecent = (
      a: { scheduledFor: string },
      b: { scheduledFor: string },
    ) =>
      new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime();

    return delay({
      upcoming: MOCK_APPOINTMENTS.filter((a) => a.status === "CONFIRMED").sort(
        bySoonest,
      ),
      requested: MOCK_APPOINTMENTS.filter((a) => a.status === "REQUESTED").sort(
        bySoonest,
      ),
      completed: MOCK_APPOINTMENTS.filter((a) => a.status === "COMPLETED").sort(
        byMostRecent,
      ),
    });
  },

  getNotifications: (limit = 5): Promise<Notification[]> =>
    delay(MOCK_NOTIFICATIONS.slice(0, limit)),

  getActivity: (limit = 6): Promise<ActivityItem[]> =>
    delay(MOCK_ACTIVITY.slice(0, limit)),
};
