import { NOTIFICATION_CATEGORY_LABEL } from "@/components/dashboard/StatusBadge";
import type { FilterChip } from "@/components/common/FilterChips";
import type {
  GetNotificationsParams,
  NotificationCategory,
  NotificationSort,
} from "@/services";
import type { NotificationStatus, NotificationType } from "@/types";

export type RawNotificationSearchParams = Record<
  string,
  string | string[] | undefined
>;

const SORT_VALUES: NotificationSort[] = ["date_desc", "date_asc"];
const STATUS_VALUES: NotificationStatus[] = ["UNREAD", "READ"];
const CATEGORY_VALUES: NotificationCategory[] = [
  "APPOINTMENT",
  "LISTING",
  "SYSTEM",
];
const PAGE_SIZE_VALUES = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

/** Human-readable label per granular type — used on notification cards/drawer, distinct from the coarser category the filter bar groups by. */
export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  APPOINTMENT_REQUESTED: "Appointment Requested",
  APPOINTMENT_CONFIRMED: "Appointment Confirmed",
  APPOINTMENT_CANCELLED: "Appointment Cancelled",
  APPOINTMENT_RESCHEDULED: "Appointment Rescheduled",
  APPOINTMENT_COMPLETED: "Appointment Completed",
  APPOINTMENT_NO_SHOW: "Appointment No Show",
  LISTING_PUBLISHED: "Listing Published",
  LISTING_SUSPENDED: "Listing Suspended",
  DRAFT_REMINDER: "Draft Reminder",
  SYSTEM: "System Notification",
};

export const NOTIFICATION_STATUS_OPTIONS: {
  value: NotificationStatus;
  label: string;
}[] = [
  { value: "UNREAD", label: "Unread" },
  { value: "READ", label: "Read" },
];

export const NOTIFICATION_CATEGORY_OPTIONS: {
  value: NotificationCategory;
  label: string;
}[] = CATEGORY_VALUES.map((value) => ({
  value,
  label: NOTIFICATION_CATEGORY_LABEL[value],
}));

export const NOTIFICATION_SORT_OPTIONS: {
  value: NotificationSort;
  label: string;
}[] = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
];

export const NOTIFICATION_PAGE_SIZE_OPTIONS = PAGE_SIZE_VALUES;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** The one place /notifications parses the URL into typed filters. */
export function parseNotificationFilters(
  raw: RawNotificationSearchParams,
): GetNotificationsParams {
  const status = first(raw.status) as NotificationStatus | undefined;
  const category = first(raw.category) as NotificationCategory | undefined;
  const sort = first(raw.sort) as NotificationSort | undefined;
  const pageSize = Number(first(raw.pageSize));

  return {
    page: Math.max(1, Number(first(raw.page)) || 1),
    pageSize: PAGE_SIZE_VALUES.includes(
      pageSize as (typeof PAGE_SIZE_VALUES)[number],
    )
      ? pageSize
      : DEFAULT_PAGE_SIZE,
    status: status && STATUS_VALUES.includes(status) ? status : undefined,
    category:
      category && CATEGORY_VALUES.includes(category) ? category : undefined,
    sort: sort && SORT_VALUES.includes(sort) ? sort : undefined,
  };
}

/** Builds the active-filter chip list for FilterChips from the current URL-derived filters. */
export function buildNotificationFilterChips(
  filters: GetNotificationsParams,
): FilterChip<keyof GetNotificationsParams>[] {
  const chips: FilterChip<keyof GetNotificationsParams>[] = [];

  if (filters.status) {
    const status = NOTIFICATION_STATUS_OPTIONS.find(
      (option) => option.value === filters.status,
    );
    chips.push({ key: "status", label: status?.label ?? filters.status });
  }

  if (filters.category) {
    chips.push({
      key: "category",
      label: NOTIFICATION_CATEGORY_LABEL[filters.category],
    });
  }

  return chips;
}
