"use client";

import { Button } from "@/components/ui/button";
import { PROPERTY_CATEGORIES } from "@/constants/categories";
import {
  LISTING_PAGE_SIZE_OPTIONS,
  LISTING_SORT_OPTIONS,
  LISTING_STATUS_OPTIONS,
} from "@/lib/listingFilters";
import type { GetListingsParams } from "@/services";
import type { ListingType } from "@/types";

interface ListingsFilterBarProps {
  filters: GetListingsParams;
  onApply: (filters: Partial<GetListingsParams>) => void;
}

const SELECT_CLASSNAME =
  "border-border bg-background h-8 rounded-md border px-2 text-sm";

/**
 * Mirrors FilterPanel's split: keyword is uncontrolled and submits on Apply
 * (no navigation per keystroke); status/category/type/sort/page-size are
 * controlled and apply immediately. The form's `key` forces a remount —
 * resetting the uncontrolled keyword field — whenever a filter changes from
 * elsewhere (e.g. a FilterChip removal), without an effect to re-sync state.
 */
export function ListingsFilterBar({
  filters,
  onApply,
}: ListingsFilterBarProps) {
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
          htmlFor="listing-filter-q"
          className="text-muted-foreground text-xs"
        >
          Search
        </label>
        <input
          id="listing-filter-q"
          name="q"
          type="text"
          defaultValue={filters.q ?? ""}
          placeholder="Title or city…"
          className="border-border bg-background h-8 w-48 rounded-md border px-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="listing-filter-status"
          className="text-muted-foreground text-xs"
        >
          Status
        </label>
        <select
          id="listing-filter-status"
          value={filters.status ?? ""}
          onChange={(event) =>
            onApply({
              status: (event.target.value ||
                undefined) as GetListingsParams["status"],
            })
          }
          className={SELECT_CLASSNAME}
        >
          <option value="">All statuses</option>
          {LISTING_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="listing-filter-category"
          className="text-muted-foreground text-xs"
        >
          Category
        </label>
        <select
          id="listing-filter-category"
          value={filters.category ?? ""}
          onChange={(event) =>
            onApply({
              category: (event.target.value ||
                undefined) as GetListingsParams["category"],
            })
          }
          className={SELECT_CLASSNAME}
        >
          <option value="">All categories</option>
          {PROPERTY_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="listing-filter-type"
          className="text-muted-foreground text-xs"
        >
          Listing type
        </label>
        <select
          id="listing-filter-type"
          value={filters.listingType ?? ""}
          onChange={(event) =>
            onApply({
              listingType: (event.target.value || undefined) as
                ListingType | undefined,
            })
          }
          className={SELECT_CLASSNAME}
        >
          <option value="">Sale &amp; Rent</option>
          <option value="SALE">For Sale</option>
          <option value="RENT">For Rent</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="listing-filter-sort"
          className="text-muted-foreground text-xs"
        >
          Sort by
        </label>
        <select
          id="listing-filter-sort"
          value={filters.sort ?? "updated_desc"}
          onChange={(event) =>
            onApply({
              sort: event.target.value as GetListingsParams["sort"],
            })
          }
          className={SELECT_CLASSNAME}
        >
          {LISTING_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="listing-filter-page-size"
          className="text-muted-foreground text-xs"
        >
          Rows per page
        </label>
        <select
          id="listing-filter-page-size"
          value={filters.pageSize ?? LISTING_PAGE_SIZE_OPTIONS[0]}
          onChange={(event) =>
            onApply({ pageSize: Number(event.target.value) })
          }
          className={SELECT_CLASSNAME}
        >
          {LISTING_PAGE_SIZE_OPTIONS.map((size) => (
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
