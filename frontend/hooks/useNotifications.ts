"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/errors";
import { notificationService, type GetNotificationsParams } from "@/services";

const NOTIFICATIONS_KEY = ["notifications"] as const;

/**
 * 30s refetch interval — matches the polling cadence ARCHITECTURE.md §9
 * already documents for the real backend ("Why Polling, Not WebSockets").
 * This is the extension point for real-time: a future WebSocket handler only
 * needs to push into this same query's cache entry
 * (`queryClient.setQueryData(["notifications", "unread-count"], n)`) or
 * invalidate it — no component here would need to change.
 */
const UNREAD_COUNT_POLL_MS = 30_000;

/** Keeps the previous page visible while the next page/filter loads, same as useListings/useAppointments. */
export function useNotifications(params: GetNotificationsParams = {}) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, params],
    queryFn: () => notificationService.getNotifications(params),
    placeholderData: keepPreviousData,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, "unread-count"],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: UNREAD_COUNT_POLL_MS,
  });
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
}

/** Silent on success — reading a notification is a frequent, low-friction action, not one worth a toast. */
export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications();

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: invalidate,
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: ({ updated }) => {
      invalidate();
      if (updated.length > 0) {
        toast.success(`${updated.length} notification(s) marked as read.`);
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
