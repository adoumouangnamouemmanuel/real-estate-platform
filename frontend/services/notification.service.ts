import { api } from "@/lib/api";
import type {
  Notification,
  NotificationStatus,
  NotificationType,
  PaginatedResult,
  ApiResponse,
} from "@/types";

const DEFAULT_PAGE_SIZE = 10;

export type NotificationSort = "date_desc" | "date_asc";

export type NotificationCategory = "APPOINTMENT" | "LISTING" | "SYSTEM";

export const NOTIFICATION_CATEGORY: Record<
  NotificationType,
  NotificationCategory
> = {
  APPOINTMENT_REQUESTED: "APPOINTMENT",
  APPOINTMENT_CONFIRMED: "APPOINTMENT",
  APPOINTMENT_CANCELLED: "APPOINTMENT",
  APPOINTMENT_RESCHEDULED: "APPOINTMENT",
  APPOINTMENT_COMPLETED: "APPOINTMENT",
  APPOINTMENT_NO_SHOW: "APPOINTMENT",
  LISTING_PUBLISHED: "LISTING",
  LISTING_SUSPENDED: "LISTING",
  DRAFT_REMINDER: "LISTING",
  SYSTEM: "SYSTEM",
};

export interface NotificationFilters {
  status?: NotificationStatus;
  category?: NotificationCategory;
  sort?: NotificationSort;
}

export interface GetNotificationsParams extends NotificationFilters {
  page?: number;
  pageSize?: number;
}

export const notificationService = {
  getNotifications: ({
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    ...filters
  }: GetNotificationsParams = {}): Promise<PaginatedResult<Notification>> => {
    const params: Record<string, string | number> = { page, pageSize };
    if (filters.status) params.status = filters.status;
    if (filters.category) params.category = filters.category;
    if (filters.sort) params.sort = filters.sort;

    return api
      .get<ApiResponse<PaginatedResult<Notification>>>(
        "/developers/me/notifications",
        { params },
      )
      .then((res) => res.data.data);
  },

  getUnreadCount: (): Promise<number> =>
    api
      .get<ApiResponse<number>>("/developers/me/notifications/unread-count")
      .then((res) => res.data.data),

  markAsRead: async (id: string): Promise<Notification> => {
    const res = await api.patch<ApiResponse<Notification>>(
      `/developers/me/notifications/${id}/read`,
    );
    return res.data.data;
  },

  markAllAsRead: (): Promise<{ updated: string[] }> =>
    api
      .patch<ApiResponse<{ updated: string[] }>>(
        "/developers/me/notifications/read-all",
      )
      .then((res) => res.data.data),
};
