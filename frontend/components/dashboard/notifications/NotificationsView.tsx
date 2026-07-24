"use client";

import { useState } from "react";

import { FilterChips } from "@/components/common/FilterChips";
import { Pagination } from "@/components/common/Pagination";
import { NotificationDetailsDrawer } from "@/components/dashboard/notifications/NotificationDetailsDrawer";
import { NotificationsFilterBar } from "@/components/dashboard/notifications/NotificationsFilterBar";
import { NotificationsList } from "@/components/dashboard/notifications/NotificationsList";
import { Button } from "@/components/ui/button";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/useNotifications";
import { buildNotificationFilterChips } from "@/lib/notificationFilters";
import type { GetNotificationsParams } from "@/services";
import type { Notification } from "@/types";

interface NotificationsViewProps {
  filters: GetNotificationsParams;
}

/**
 * Orchestrates the Notifications page: URL-driven filters/pagination
 * (mirroring AppointmentsView/ListingsView), the read-state mutations, and
 * the details drawer. No row selection/bulk toolbar here — "Mark all as
 * read" already covers the one bulk action this domain needs; a checkbox
 * multi-select would just add UI for actions nobody else asked for.
 */
export function NotificationsView({ filters }: NotificationsViewProps) {
  const { data, isLoading, isError, error } = useNotifications(filters);
  const { data: unreadCount } = useUnreadNotificationCount();
  const updateParams = useFilterNavigation<GetNotificationsParams>();

  const [detailsTarget, setDetailsTarget] = useState<Notification | null>(null);

  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();

  const pendingIds = new Set<string>();
  if (markAsRead.isPending && markAsRead.variables) {
    pendingIds.add(markAsRead.variables);
  }

  function handleFilterChange(partial: Partial<GetNotificationsParams>) {
    updateParams({ ...filters, ...partial, page: 1 });
  }

  function handleRemoveFilter(key: keyof GetNotificationsParams) {
    handleFilterChange({ [key]: undefined });
  }

  function handlePageChange(page: number) {
    updateParams({ ...filters, page });
  }

  const hasActiveFilters = Boolean(filters.status || filters.category);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-muted-foreground text-sm">
          {unreadCount !== undefined &&
            (unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up")}
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={!unreadCount || markAllAsRead.isPending}
          onClick={() => markAllAsRead.mutate()}
        >
          Mark all as read
        </Button>
      </div>

      <NotificationsFilterBar filters={filters} onApply={handleFilterChange} />
      <FilterChips
        chips={buildNotificationFilterChips(filters)}
        onRemove={handleRemoveFilter}
      />

      <NotificationsList
        notifications={data?.items ?? []}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onOpenDetails={setDetailsTarget}
        onMarkAsRead={(id) => markAsRead.mutate(id)}
        pendingIds={pendingIds}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() =>
          handleFilterChange({ status: undefined, category: undefined })
        }
      />

      {data && data.totalPages > 1 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <NotificationDetailsDrawer
        notification={detailsTarget}
        onOpenChange={(open) => {
          if (!open) setDetailsTarget(null);
        }}
        onMarkAsRead={(id) => {
          setDetailsTarget(null);
          markAsRead.mutate(id);
        }}
        isPending={markAsRead.isPending}
      />
    </div>
  );
}
