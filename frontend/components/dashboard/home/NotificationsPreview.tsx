"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isFeatureEnabled } from "@/constants/features";
import { ROUTES } from "@/constants/routes";
import { useDashboardNotifications } from "@/hooks/useDashboard";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatters";
import { NOTIFICATION_ICON } from "@/lib/notificationIcons";
import type { Notification } from "@/types";

function NotificationRow({ notification }: { notification: Notification }) {
  const Icon = NOTIFICATION_ICON[notification.type];
  const isUnread = notification.status === "UNREAD";

  return (
    <li className={cn("flex gap-3 rounded-lg p-2", isUnread && "bg-muted/50")}>
      <span className="bg-muted text-muted-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          {isUnread && (
            <>
              <span
                className="size-2 shrink-0 rounded-full bg-sky-500"
                aria-hidden
              />
              <span className="sr-only">Unread: </span>
            </>
          )}
          {notification.title}
        </p>
        <p className="text-muted-foreground text-xs">{notification.body}</p>
        <time
          dateTime={notification.createdAt}
          className="text-muted-foreground text-xs"
        >
          {formatRelativeTime(notification.createdAt)}
        </time>
      </div>
    </li>
  );
}

/** The latest notifications, with unread items visually and non-visually marked. */
export function NotificationsPreview() {
  const { data, isLoading, isError } = useDashboardNotifications();

  const viewAll = isFeatureEnabled("DASHBOARD_NOTIFICATIONS") ? (
    <Link
      href={ROUTES.NOTIFICATIONS}
      className={buttonVariants({ variant: "ghost", size: "sm" })}
    >
      View all
    </Link>
  ) : undefined;

  return (
    <DashboardSection
      title="Notifications"
      description="Your latest updates."
      icon={Bell}
      action={viewAll}
    >
      {isError ? (
        <ErrorState
          title="Couldn't load your notifications."
          description="Please refresh the page to try again."
        />
      ) : isLoading || !data ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          title="You're all caught up"
          description="New notifications will show up here."
        />
      ) : (
        <ul className="-mx-2 flex flex-col gap-1">
          {data.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
            />
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
