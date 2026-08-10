import {
  Ban,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CalendarX,
  Clock,
  Info,
  Tag,
  UserX,
  type LucideIcon,
} from "lucide-react";

import type { NotificationType } from "@/types";

/** Shared by NotificationsPreview (Dashboard Home) and the Notifications page — one icon per type, never duplicated. Suspended reuses the same `Ban` icon ActionNeededList's SUSPENDED_LISTINGS item already uses, rather than sharing LISTING_PUBLISHED's neutral `Tag` — a suspension is a different, unwelcome event and shouldn't look identical to a routine publish at a glance. */
export const NOTIFICATION_ICON: Record<NotificationType, LucideIcon> = {
  APPOINTMENT_REQUESTED: CalendarPlus,
  APPOINTMENT_CONFIRMED: CalendarCheck,
  APPOINTMENT_CANCELLED: CalendarX,
  APPOINTMENT_RESCHEDULED: CalendarClock,
  APPOINTMENT_COMPLETED: CalendarCheck,
  APPOINTMENT_NO_SHOW: UserX,
  LISTING_PUBLISHED: Tag,
  LISTING_SUSPENDED: Ban,
  DRAFT_REMINDER: Clock,
  SYSTEM: Info,
};
