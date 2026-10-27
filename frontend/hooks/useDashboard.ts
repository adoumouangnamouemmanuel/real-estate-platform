"use client";
import { useContentLocale as useLanguage } from "@/hooks/useContentLocale";

import { useQuery } from "@tanstack/react-query";

import { dashboardService } from "@/services";

/**
 * One thin React Query hook per dashboard-home widget, mirroring useProperties.
 * Each widget owns its own loading/error/empty state this way, and because the
 * query keys are stable the welcome header and the KPI grid share a single
 * metrics fetch instead of requesting it twice.
 */

export function useDashboardSummary() {
  const { language } = useLanguage();
  return useQuery({
    queryKey: ["dashboard", "summary", language],
    queryFn: () => dashboardService.getSummary(),
  });
}

export function useDashboardMetrics() {
  const { language } = useLanguage();
  return useQuery({
    queryKey: ["dashboard", "metrics", language],
    queryFn: () => dashboardService.getMetrics(),
  });
}

export function useRecentListings(limit = 5) {
  const { language } = useLanguage();
  return useQuery({
    queryKey: ["dashboard", "recent-listings", limit, language],
    queryFn: () => dashboardService.getRecentListings(limit),
  });
}

export function useDashboardActionNeeded() {
  const { language } = useLanguage();
  return useQuery({
    queryKey: ["dashboard", "action-needed", language],
    queryFn: () => dashboardService.getActionNeeded(),
  });
}

export function useAppointmentOverview() {
  const { language } = useLanguage();
  return useQuery({
    queryKey: ["dashboard", "appointments", language],
    queryFn: () => dashboardService.getAppointmentOverview(),
  });
}

export function useDashboardNotifications(limit = 5) {
  const { language } = useLanguage();
  return useQuery({
    queryKey: ["dashboard", "notifications", limit, language],
    queryFn: () => dashboardService.getNotifications(limit),
  });
}

export function useDashboardActivity(limit = 6) {
  const { language } = useLanguage();
  return useQuery({
    queryKey: ["dashboard", "activity", limit, language],
    queryFn: () => dashboardService.getActivity(limit),
  });
}
