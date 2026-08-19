"use client";

import type { PropertySort } from "@/services";

const SORT_OPTIONS: { value: PropertySort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

interface SortSelectProps {
  value: PropertySort | undefined;
  onChange: (sort: PropertySort) => void;
}

/**
 * Extracted from FilterPanel: sorting is a view control, not a filter. It
 * changes the order of the same result set rather than which properties are in
 * it, so it belongs beside the result count above the grid — not inside a panel
 * whose other controls all narrow the catalogue, and not represented as a
 * removable FilterChip.
 *
 * The applied sort value and its `onChange` contract are unchanged.
 */
export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="filter-sort"
        className="text-muted-foreground shrink-0 text-sm"
      >
        Sort by
      </label>
      <select
        id="filter-sort"
        value={value ?? "newest"}
        onChange={(event) => onChange(event.target.value as PropertySort)}
        className="border-border bg-background hover:border-foreground/30 focus-visible:ring-ring/50 h-9 rounded-md border px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
