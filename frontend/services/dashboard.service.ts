import { api } from "@/lib/api";
import type {
  ActionNeededItem,
  ActivityItem,
  AppointmentOverview,
  DashboardMetrics,
  DashboardSummary,
  Notification,
  Property,
  ApiResponse,
} from "@/types";

/** The developer dashboard's data seam. Every method calls one backend endpoint. */
export const dashboardService = {
  getDashboard: (): Promise<{
    summary: DashboardSummary;
    metrics: DashboardMetrics;
    recentListings: Property[];
    appointmentOverview: AppointmentOverview;
    actionNeeded: ActionNeededItem[];
    recentNotifications: Notification[];
    recentActivity: ActivityItem[];
  }> =>
    api
      .get<
        ApiResponse<{
          summary: DashboardSummary;
          metrics: DashboardMetrics;
          recentListings: Property[];
          appointmentOverview: AppointmentOverview;
          actionNeeded: ActionNeededItem[];
          recentNotifications: Notification[];
          recentActivity: ActivityItem[];
        }>
      >("/developers/me/dashboard")
      .then((res) => res.data.data),

  getSummary: (): Promise<DashboardSummary> =>
    dashboardService.getDashboard().then((d) => d.summary),

  getMetrics: (): Promise<DashboardMetrics> =>
    dashboardService.getDashboard().then((d) => d.metrics),

  getRecentListings: (limit = 5): Promise<Property[]> =>
    dashboardService
      .getDashboard()
      .then((d) => d.recentListings.slice(0, limit)),

  getActionNeeded: (): Promise<ActionNeededItem[]> =>
    dashboardService.getDashboard().then((d) => d.actionNeeded),

  getAppointmentOverview: (): Promise<AppointmentOverview> =>
    dashboardService.getDashboard().then((d) => d.appointmentOverview),

  getNotifications: (limit = 5): Promise<Notification[]> =>
    dashboardService
      .getDashboard()
      .then((d) => d.recentNotifications.slice(0, limit)),

  getActivity: (limit = 6): Promise<ActivityItem[]> =>
    dashboardService
      .getDashboard()
      .then((d) => d.recentActivity.slice(0, limit)),
};
