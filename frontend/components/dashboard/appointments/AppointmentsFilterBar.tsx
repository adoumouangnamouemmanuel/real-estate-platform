"use client";

import { Button } from "@/components/ui/button";
import {
  APPOINTMENT_PAGE_SIZE_OPTIONS,
  APPOINTMENT_SORT_OPTIONS,
  APPOINTMENT_STATUS_OPTIONS,
  APPOINTMENT_TIMEFRAME_OPTIONS,
} from "@/lib/appointmentFilters";
import type { GetAppointmentsParams } from "@/services";

interface AppointmentsFilterBarProps {
  filters: GetAppointmentsParams;
  onApply: (filters: Partial<GetAppointmentsParams>) => void;
}

const SELECT_CLASSNAME =
  "border-border bg-background h-8 rounded-md border px-2 text-sm";

/**
 * Mirrors ListingsFilterBar's split: keyword is uncontrolled and submits on
 * Apply; status/timeframe/sort/page-size are controlled and apply
 * immediately. The form's `key` forces a remount whenever the keyword changes
 * from elsewhere (e.g. a FilterChip removal).
 */
export function AppointmentsFilterBar({
  filters,
  onApply,
}: AppointmentsFilterBarProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = (formData.get("q") as string).trim();
    onApply({ q: q || undefined });
  }

  return (
    <form
      key={filters.q ?? ""}
      onSubmit={handleSubmit}
      className="border-border flex flex-wrap items-end gap-3 rounded-lg border p-4"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="appointment-filter-q"
          className="text-muted-foreground text-xs"
        >
          Search
        </label>
        <input
          id="appointment-filter-q"
          name="q"
          type="text"
          defaultValue={filters.q ?? ""}
          placeholder="Client or property…"
          className="border-border bg-background h-8 w-48 rounded-md border px-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="appointment-filter-status"
          className="text-muted-foreground text-xs"
        >
          Status
        </label>
        <select
          id="appointment-filter-status"
          value={filters.status ?? ""}
          onChange={(event) =>
            onApply({
              status: (event.target.value ||
                undefined) as GetAppointmentsParams["status"],
            })
          }
          className={SELECT_CLASSNAME}
        >
          <option value="">All statuses</option>
          {APPOINTMENT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="appointment-filter-timeframe"
          className="text-muted-foreground text-xs"
        >
          When
        </label>
        <select
          id="appointment-filter-timeframe"
          value={filters.timeframe ?? ""}
          onChange={(event) =>
            onApply({
              timeframe: (event.target.value ||
                undefined) as GetAppointmentsParams["timeframe"],
            })
          }
          className={SELECT_CLASSNAME}
        >
          <option value="">Any time</option>
          {APPOINTMENT_TIMEFRAME_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="appointment-filter-sort"
          className="text-muted-foreground text-xs"
        >
          Sort by
        </label>
        <select
          id="appointment-filter-sort"
          value={filters.sort ?? "date_asc"}
          onChange={(event) =>
            onApply({
              sort: event.target.value as GetAppointmentsParams["sort"],
            })
          }
          className={SELECT_CLASSNAME}
        >
          {APPOINTMENT_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="appointment-filter-page-size"
          className="text-muted-foreground text-xs"
        >
          Rows per page
        </label>
        <select
          id="appointment-filter-page-size"
          value={filters.pageSize ?? APPOINTMENT_PAGE_SIZE_OPTIONS[0]}
          onChange={(event) =>
            onApply({ pageSize: Number(event.target.value) })
          }
          className={SELECT_CLASSNAME}
        >
          {APPOINTMENT_PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" size="sm">
        Apply
      </Button>
    </form>
  );
}
