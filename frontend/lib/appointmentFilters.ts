import { APPOINTMENT_STATUS_LABEL } from "@/components/dashboard/StatusBadge";
import type { FilterChip } from "@/components/common/FilterChips";
import type {
  AppointmentSort,
  AppointmentTimeframe,
  GetAppointmentsParams,
} from "@/services";
import type { AppointmentStatus } from "@/types";

export type RawAppointmentSearchParams = Record<
  string,
  string | string[] | undefined
>;

const SORT_VALUES: AppointmentSort[] = ["date_asc", "date_desc"];
const STATUS_VALUES: AppointmentStatus[] = [
  "REQUESTED",
  "CONFIRMED",
  "RESCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];
const TIMEFRAME_VALUES: AppointmentTimeframe[] = [
  "today",
  "upcoming",
  "overdue",
];
const PAGE_SIZE_VALUES = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

export const APPOINTMENT_STATUS_OPTIONS: {
  value: AppointmentStatus;
  label: string;
}[] = STATUS_VALUES.map((value) => ({
  value,
  label: APPOINTMENT_STATUS_LABEL[value],
}));

export const APPOINTMENT_TIMEFRAME_OPTIONS: {
  value: AppointmentTimeframe;
  label: string;
}[] = [
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "overdue", label: "Overdue" },
];

export const APPOINTMENT_SORT_OPTIONS: {
  value: AppointmentSort;
  label: string;
}[] = [
  { value: "date_asc", label: "Soonest first" },
  { value: "date_desc", label: "Latest first" },
];

export const APPOINTMENT_PAGE_SIZE_OPTIONS = PAGE_SIZE_VALUES;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** The one place /appointments parses the URL into typed filters. */
export function parseAppointmentFilters(
  raw: RawAppointmentSearchParams,
): GetAppointmentsParams {
  const status = first(raw.status) as AppointmentStatus | undefined;
  const timeframe = first(raw.timeframe) as AppointmentTimeframe | undefined;
  const sort = first(raw.sort) as AppointmentSort | undefined;
  const pageSize = Number(first(raw.pageSize));

  return {
    page: Math.max(1, Number(first(raw.page)) || 1),
    pageSize: PAGE_SIZE_VALUES.includes(
      pageSize as (typeof PAGE_SIZE_VALUES)[number],
    )
      ? pageSize
      : DEFAULT_PAGE_SIZE,
    q: first(raw.q) || undefined,
    status: status && STATUS_VALUES.includes(status) ? status : undefined,
    timeframe:
      timeframe && TIMEFRAME_VALUES.includes(timeframe) ? timeframe : undefined,
    sort: sort && SORT_VALUES.includes(sort) ? sort : undefined,
  };
}

/** Builds the active-filter chip list for FilterChips from the current URL-derived filters. */
export function buildAppointmentFilterChips(
  filters: GetAppointmentsParams,
): FilterChip<keyof GetAppointmentsParams>[] {
  const chips: FilterChip<keyof GetAppointmentsParams>[] = [];

  if (filters.q) chips.push({ key: "q", label: `"${filters.q}"` });

  if (filters.status) {
    chips.push({
      key: "status",
      label: APPOINTMENT_STATUS_LABEL[filters.status],
    });
  }

  if (filters.timeframe) {
    const timeframe = APPOINTMENT_TIMEFRAME_OPTIONS.find(
      (option) => option.value === filters.timeframe,
    );
    chips.push({
      key: "timeframe",
      label: timeframe?.label ?? filters.timeframe,
    });
  }

  return chips;
}
