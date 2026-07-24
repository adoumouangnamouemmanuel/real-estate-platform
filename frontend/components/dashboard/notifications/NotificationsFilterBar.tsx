"use client";

import {
  NOTIFICATION_CATEGORY_OPTIONS,
  NOTIFICATION_PAGE_SIZE_OPTIONS,
  NOTIFICATION_SORT_OPTIONS,
  NOTIFICATION_STATUS_OPTIONS,
} from "@/lib/notificationFilters";
import type { GetNotificationsParams } from "@/services";

interface NotificationsFilterBarProps {
  filters: GetNotificationsParams;
  onApply: (filters: Partial<GetNotificationsParams>) => void;
}

const SELECT_CLASSNAME =
  "border-border bg-background h-8 rounded-md border px-2 text-sm";

/**
 * No keyword search — unlike Listings/Appointments, notification titles are
 * short and system-generated, not worth full-text filtering. Every control
 * here applies immediately on change; no uncontrolled field means no "Apply"
 * submit step is needed.
 */
export function NotificationsFilterBar({
  filters,
  onApply,
}: NotificationsFilterBarProps) {
  return (
    <div className="border-border flex flex-wrap items-end gap-3 rounded-lg border p-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="notification-filter-status"
          className="text-muted-foreground text-xs"
        >
          Status
        </label>
        <select
          id="notification-filter-status"
          value={filters.status ?? ""}
          onChange={(event) =>
            onApply({
              status: (event.target.value ||
                undefined) as GetNotificationsParams["status"],
            })
          }
          className={SELECT_CLASSNAME}
        >
          <option value="">All</option>
          {NOTIFICATION_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="notification-filter-category"
          className="text-muted-foreground text-xs"
        >
          Category
        </label>
        <select
          id="notification-filter-category"
          value={filters.category ?? ""}
          onChange={(event) =>
            onApply({
              category: (event.target.value ||
                undefined) as GetNotificationsParams["category"],
            })
          }
          className={SELECT_CLASSNAME}
        >
          <option value="">All categories</option>
          {NOTIFICATION_CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="notification-filter-sort"
          className="text-muted-foreground text-xs"
        >
          Sort by
        </label>
        <select
          id="notification-filter-sort"
          value={filters.sort ?? "date_desc"}
          onChange={(event) =>
            onApply({
              sort: event.target.value as GetNotificationsParams["sort"],
            })
          }
          className={SELECT_CLASSNAME}
        >
          {NOTIFICATION_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="notification-filter-page-size"
          className="text-muted-foreground text-xs"
        >
          Rows per page
        </label>
        <select
          id="notification-filter-page-size"
          value={filters.pageSize ?? NOTIFICATION_PAGE_SIZE_OPTIONS[0]}
          onChange={(event) =>
            onApply({ pageSize: Number(event.target.value) })
          }
          className={SELECT_CLASSNAME}
        >
          {NOTIFICATION_PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
