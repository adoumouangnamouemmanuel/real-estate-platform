"use client";

import Link from "next/link";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { NotificationCategoryBadge } from "@/components/dashboard/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";
import { NOTIFICATION_ICON } from "@/lib/notificationIcons";
import { NOTIFICATION_CATEGORY, type NotificationCategory } from "@/services";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";

interface NotificationsListProps {
  notifications: Notification[];
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onOpenDetails: (notification: Notification) => void;
  onMarkAsRead: (id: string) => void;
  /** Notification IDs with a mutation currently in flight — disables that card's own action. */
  pendingIds: Set<string>;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

function NotificationCard({
  notification,
  onOpenDetails,
  onMarkAsRead,
  isPending,
}: {
  notification: Notification;
  onOpenDetails: (notification: Notification) => void;
  onMarkAsRead: (id: string) => void;
  isPending: boolean;
}) {
  const Icon = NOTIFICATION_ICON[notification.type];
  const category: NotificationCategory =
    NOTIFICATION_CATEGORY[notification.type];
  const isUnread = notification.status === "UNREAD";

  return (
    <li
      className={cn(
        "border-border flex gap-3 rounded-lg border border-l-4 p-3 transition-colors",
        isUnread ? "bg-muted/50 border-l-primary" : "border-l-transparent",
      )}
    >
      <span className="bg-muted text-muted-foreground mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full">
        <Icon className="size-4.5" aria-hidden />
      </span>

      <button
        type="button"
        onClick={() => onOpenDetails(notification)}
        className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
      >
        <span className="flex w-full flex-wrap items-center gap-2">
          {isUnread && (
            <>
              <span
                className="bg-primary size-2 shrink-0 rounded-full"
                aria-hidden
              />
              <span className="sr-only">Unread: </span>
            </>
          )}
          <span className="text-sm font-medium">{notification.title}</span>
          <NotificationCategoryBadge category={category} />
        </span>
        <span className="text-muted-foreground line-clamp-2 text-sm">
          {notification.body}
        </span>
        <time
          dateTime={notification.createdAt}
          title={formatDateTime(notification.createdAt)}
          className="text-muted-foreground text-xs"
        >
          {formatRelativeTime(notification.createdAt)}
        </time>
      </button>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {notification.link && (
          <Link
            href={notification.link}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            View
          </Link>
        )}
        {isUnread && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => onMarkAsRead(notification.id)}
          >
            Mark as read
          </Button>
        )}
      </div>
    </li>
  );
}

function NotificationsListSkeleton() {
  return (
    <ul role="status" aria-live="polite" className="flex flex-col gap-2">
      <span className="sr-only">Loading notifications…</span>
      {Array.from({ length: 6 }).map((_, index) => (
        <li key={index}>
          <Skeleton className="h-20 w-full" aria-hidden />
        </li>
      ))}
    </ul>
  );
}

/**
 * A card-list feed, not a `Table` — notifications are heterogeneous inbox
 * items (icon, title, body, timestamp), not comparable tabular rows, matching
 * the pattern NotificationsPreview (Phase 6.1) already established. Loading
 * skeleton, error state, and both a true-empty and filtered-to-nothing empty
 * state mirror ListingsTable/AppointmentsTable.
 */
export function NotificationsList({
  notifications,
  isLoading,
  isError,
  error,
  onOpenDetails,
  onMarkAsRead,
  pendingIds,
  hasActiveFilters,
  onClearFilters,
}: NotificationsListProps) {
  if (isError) {
    return (
      <ErrorState
        title="Couldn't load your notifications."
        description={getErrorMessage(error)}
      />
    );
  }

  if (isLoading) {
    return <NotificationsListSkeleton />;
  }

  if (notifications.length === 0) {
    return hasActiveFilters ? (
      <EmptyState
        title="No notifications match your filters"
        description="Try adjusting or clearing your filters."
        action={
          <button
            type="button"
            onClick={onClearFilters}
            className="text-primary text-sm font-medium hover:underline"
          >
            Clear filters
          </button>
        }
      />
    ) : (
      <EmptyState
        title="You're all caught up"
        description="New notifications will show up here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onOpenDetails={onOpenDetails}
          onMarkAsRead={onMarkAsRead}
          isPending={pendingIds.has(notification.id)}
        />
      ))}
    </ul>
  );
}
