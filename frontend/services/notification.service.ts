import type {
  Notification,
  NotificationStatus,
  NotificationType,
  PaginatedResult,
} from "@/types";

import { MOCK_NOTIFICATIONS } from "./mocks/notifications.mock";

const DEFAULT_PAGE_SIZE = 10;
const MOCK_LATENCY_MS = 400;

export type NotificationSort = "date_desc" | "date_asc";

/**
 * The coarse grouping the filter bar offers — derived from `NotificationType`
 * via `NOTIFICATION_CATEGORY`, never stored on the notification itself, so
 * there's exactly one place a new type's category can be wrong. Mirrors how
 * `AppointmentActionPolicy` centralizes status → action instead of letting
 * every call site re-derive it.
 */
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

function filterNotifications(
  items: Notification[],
  filters: NotificationFilters,
): Notification[] {
  return items.filter((item) => {
    if (filters.status && item.status !== filters.status) return false;
    if (
      filters.category &&
      NOTIFICATION_CATEGORY[item.type] !== filters.category
    )
      return false;
    return true;
  });
}

function sortNotifications(
  items: Notification[],
  sort: NotificationSort = "date_desc",
): Notification[] {
  const byDateAsc = (a: Notification, b: Notification) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

  if (sort === "date_asc") return [...items].sort(byDateAsc);
  return [...items].sort((a, b) => -byDateAsc(a, b));
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(value), MOCK_LATENCY_MS),
  );
}

function findNotificationOrThrow(id: string): Notification {
  const notification = MOCK_NOTIFICATIONS.find((item) => item.id === id);
  if (!notification) throw new Error("Notification not found");
  return notification;
}

/**
 * The developer's notification inbox — filtering, sorting, pagination, and
 * the read-state mutations the Notifications page and the nav badge need.
 * Deliberately independent from `dashboard.service.ts`'s existing
 * `getNotifications`/`MOCK_NOTIFICATIONS` (Phase 6.1's Dashboard Home
 * widget) — same reasoning as MOCK_LISTINGS vs MOCK_DASHBOARD_LISTINGS
 * (ADR-011/012) and MOCK_APPOINTMENTS' equivalent split (ADR-014).
 *
 * This is the single seam every future module reads/writes notifications
 * through — nothing else may touch `notifications.mock.ts` directly. A real
 * backend produces notifications from its own mutations (see ARCHITECTURE.md
 * §9's enqueue flow); this service only ever consumes them.
 * TODO(backend): replace every method with GET/PATCH
 * /api/v1/developers/me/notifications once it exists.
 */
export const notificationService = {
  getNotifications: ({
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    ...filters
  }: GetNotificationsParams = {}): Promise<PaginatedResult<Notification>> => {
    const results = sortNotifications(
      filterNotifications(MOCK_NOTIFICATIONS, filters),
      filters.sort,
    );
    return delay(paginate(results, page, pageSize));
  },

  /**
   * Its own lightweight query rather than a client-side count over
   * `getNotifications` — the natural target for polling (see
   * ARCHITECTURE.md §9's "Why Polling, Not WebSockets") and, later, for a
   * push-driven cache update: a future WebSocket handler only ever needs to
   * write to this one query's cache entry.
   */
  getUnreadCount: (): Promise<number> =>
    delay(MOCK_NOTIFICATIONS.filter((item) => item.status === "UNREAD").length),

  /**
   * `async` (not a plain arrow returning a Promise) so that
   * `findNotificationOrThrow`'s synchronous throw on an unknown id becomes a
   * proper rejected promise, not an exception thrown at call time — a real
   * bug caught by this method's own "rejects an unknown id" test.
   */
  markAsRead: async (id: string): Promise<Notification> => {
    const notification = findNotificationOrThrow(id);
    if (notification.status === "UNREAD") {
      notification.status = "READ";
    }
    return delay(notification);
  },

  markAllAsRead: (): Promise<{ updated: string[] }> => {
    const updated: string[] = [];
    for (const notification of MOCK_NOTIFICATIONS) {
      if (notification.status === "UNREAD") {
        notification.status = "READ";
        updated.push(notification.id);
      }
    }
    return delay({ updated });
  },
};
