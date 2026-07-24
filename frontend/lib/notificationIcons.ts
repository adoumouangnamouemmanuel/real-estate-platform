import {
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

/** Shared by NotificationsPreview (Dashboard Home) and the Notifications page — one icon per type, never duplicated. */
export const NOTIFICATION_ICON: Record<NotificationType, LucideIcon> = {
  APPOINTMENT_REQUESTED: CalendarPlus,
  APPOINTMENT_CONFIRMED: CalendarCheck,
  APPOINTMENT_CANCELLED: CalendarX,
  APPOINTMENT_RESCHEDULED: CalendarClock,
  APPOINTMENT_COMPLETED: CalendarCheck,
  APPOINTMENT_NO_SHOW: UserX,
  LISTING_PUBLISHED: Tag,
  LISTING_SUSPENDED: Tag,
  DRAFT_REMINDER: Clock,
  SYSTEM: Info,
};
