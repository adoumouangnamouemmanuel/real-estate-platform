"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardService } from "@/services";

/**
 * One thin React Query hook per dashboard-home widget, mirroring useProperties.
 * Each widget owns its own loading/error/empty state this way, and because the
 * query keys are stable the welcome header and the KPI grid share a single
 * metrics fetch instead of requesting it twice.
 */

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => dashboardService.getSummary(),
  });
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard", "metrics"],
    queryFn: () => dashboardService.getMetrics(),
  });
}

export function useRecentListings(limit = 5) {
  return useQuery({
    queryKey: ["dashboard", "recent-listings", limit],
    queryFn: () => dashboardService.getRecentListings(limit),
  });
}

export function useAppointmentOverview() {
  return useQuery({
    queryKey: ["dashboard", "appointments"],
    queryFn: () => dashboardService.getAppointmentOverview(),
  });
}

export function useDashboardNotifications(limit = 5) {
  return useQuery({
    queryKey: ["dashboard", "notifications", limit],
    queryFn: () => dashboardService.getNotifications(limit),
  });
}

export function useDashboardActivity(limit = 6) {
  return useQuery({
    queryKey: ["dashboard", "activity", limit],
    queryFn: () => dashboardService.getActivity(limit),
  });
}
