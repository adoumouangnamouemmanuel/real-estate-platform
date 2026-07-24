import {
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CalendarX,
  Eye,
  Pencil,
  UserCog,
  UserX,
  type LucideIcon,
} from "lucide-react";

import { formatDateTime, formatRelativeTime } from "@/lib/formatters";
import type { ActivityItem, ActivityType } from "@/types";

const ACTIVITY_ICON: Record<ActivityType, LucideIcon> = {
  LISTING_PUBLISHED: Building2,
  LISTING_UPDATED: Pencil,
  APPOINTMENT_REQUESTED: CalendarPlus,
  APPOINTMENT_CONFIRMED: CalendarCheck,
  APPOINTMENT_RESCHEDULED: CalendarClock,
  APPOINTMENT_COMPLETED: CalendarCheck,
  APPOINTMENT_CANCELLED: CalendarX,
  APPOINTMENT_NO_SHOW: UserX,
  PROPERTY_VIEWED: Eye,
  PROFILE_UPDATED: UserCog,
};

interface ActivityTimelineProps {
  items: ActivityItem[];
}

/**
 * Reusable vertical activity feed: an icon-anchored, connected timeline of events.
 * Purely presentational and data-shape-driven (ActivityItem[]), so backend
 * integration only swaps what fills `items` — this component never changes. The
 * parent decides empty/loading/error; a non-empty list is assumed here.
 */
export function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <ol className="flex flex-col">
      {items.map((item, index) => {
        const Icon = ACTIVITY_ICON[item.type];
        const isLast = index === items.length - 1;

        return (
          <li key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                <Icon className="size-4" aria-hidden />
              </span>
              {!isLast && (
                <span className="bg-border w-px flex-1" aria-hidden />
              )}
            </div>
            <div className={isLast ? "pb-0" : "pb-5"}>
              <p className="text-sm">{item.message}</p>
              <time
                dateTime={item.timestamp}
                title={formatDateTime(item.timestamp)}
                className="text-muted-foreground text-xs"
              >
                {formatRelativeTime(item.timestamp)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
