"use client";

import Link from "next/link";

import { NotificationCategoryBadge } from "@/components/dashboard/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatDateTime } from "@/lib/formatters";
import { NOTIFICATION_TYPE_LABEL } from "@/lib/notificationFilters";
import { NOTIFICATION_ICON } from "@/lib/notificationIcons";
import { NOTIFICATION_CATEGORY, type NotificationCategory } from "@/services";
import type { Notification } from "@/types";

interface NotificationDetailsDrawerProps {
  notification: Notification | null;
  onOpenChange: (open: boolean) => void;
  onMarkAsRead: (id: string) => void;
  isPending: boolean;
}

/**
 * A side panel (swipeDirection="right") showing a single notification in
 * full — its exact type/category, timestamp, and complete body text (the
 * card list truncates body to two lines). No ActivityTimeline here: unlike
 * an appointment, a single notification has no history of its own to render,
 * just the one event it represents.
 */
export function NotificationDetailsDrawer({
  notification,
  onOpenChange,
  onMarkAsRead,
  isPending,
}: NotificationDetailsDrawerProps) {
  const Icon = notification ? NOTIFICATION_ICON[notification.type] : null;
  const category: NotificationCategory | null = notification
    ? NOTIFICATION_CATEGORY[notification.type]
    : null;

  return (
    <Drawer
      open={Boolean(notification)}
      onOpenChange={onOpenChange}
      swipeDirection="right"
    >
      <DrawerContent>
        {notification && Icon && category && (
          <>
            <DrawerHeader>
              <DrawerTitle>{notification.title}</DrawerTitle>
              <DrawerDescription>
                {NOTIFICATION_TYPE_LABEL[notification.type]}
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex flex-col gap-4 overflow-y-auto p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  {formatDateTime(notification.createdAt)}
                </span>
                <NotificationCategoryBadge category={category} />
              </div>

              <p className="text-sm">{notification.body}</p>
            </div>

            <DrawerFooter className="flex-row flex-wrap justify-end">
              {notification.link && (
                <Link
                  href={notification.link}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  View details
                </Link>
              )}
              {notification.status === "UNREAD" && (
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  Mark as read
                </Button>
              )}
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
