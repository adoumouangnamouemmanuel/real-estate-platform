"use client";

import { Button } from "@/components/ui/button";
import { CITIES } from "@/constants/locations";
import type { DeveloperSort, GetDevelopersParams } from "@/services";

interface DeveloperFilterPanelProps {
  filters: GetDevelopersParams;
  onApply: (filters: Partial<GetDevelopersParams>) => void;
}

const SORT_OPTIONS: { value: DeveloperSort; label: string }[] = [
  { value: "rating_desc", label: "Highest Rated" },
  { value: "listings_desc", label: "Most Listings" },
  { value: "name_asc", label: "Name A–Z" },
];

const SELECT_CLASSNAME =
  "border-border bg-background h-8 rounded-md border px-2 text-sm";
const INPUT_CLASSNAME =
  "border-border bg-background h-8 w-48 rounded-md border px-2 text-sm";

/** Same interaction pattern as FilterPanel (uncontrolled keyword, key-remounted on external change). */
export function DeveloperFilterPanel({
  filters,
  onApply,
}: DeveloperFilterPanelProps) {
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
        <label htmlFor="dev-filter-q" className="text-muted-foreground text-xs">
          Keyword
        </label>
        <input
          id="dev-filter-q"
          name="q"
          type="text"
          defaultValue={filters.q ?? ""}
          placeholder="Company name, city…"
          className={INPUT_CLASSNAME}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="dev-filter-city"
          className="text-muted-foreground text-xs"
        >
          Location
        </label>
        <select
          id="dev-filter-city"
          value={filters.city ?? ""}
          onChange={(event) =>
            onApply({ city: event.target.value || undefined })
          }
          className={SELECT_CLASSNAME}
        >
          <option value="">All locations</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="dev-filter-sort"
          className="text-muted-foreground text-xs"
        >
          Sort by
        </label>
        <select
          id="dev-filter-sort"
          value={filters.sort ?? "rating_desc"}
          onChange={(event) =>
            onApply({ sort: event.target.value as DeveloperSort })
          }
          className={SELECT_CLASSNAME}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
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
