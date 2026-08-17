"use client";

import { Button } from "@/components/ui/button";
import {
  PROPERTY_CATEGORIES,
  type PropertyCategory,
} from "@/constants/categories";
import { CITIES } from "@/constants/locations";
import {
  BEDROOM_CATEGORIES,
  LISTING_TYPE_OPTIONS,
} from "@/lib/propertyFilters";
import type { GetPropertiesParams, PropertySort } from "@/services";
import type { ListingType } from "@/types";

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5];

interface FilterPanelProps {
  filters: GetPropertiesParams;
  onApply: (filters: Partial<GetPropertiesParams>) => void;
}

const SORT_OPTIONS: { value: PropertySort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const CONTROL_BASE =
  "border-border bg-background h-9 rounded-md border px-2.5 text-sm transition-colors hover:border-foreground/30 focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none";
const SELECT_CLASSNAME = CONTROL_BASE;
const INPUT_CLASSNAME = `${CONTROL_BASE} w-28`;

/**
 * Keyword + price are uncontrolled and submit-on-Apply (avoids a nav per keystroke); category,
 * city, and sort are controlled directly from `filters` and apply immediately. The form's `key`
 * forces a remount — resetting the uncontrolled fields' defaultValue — whenever a filter changes
 * from elsewhere (e.g. a FilterChip removal), without needing an effect to re-sync local state.
 */
export function FilterPanel({ filters, onApply }: FilterPanelProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = (formData.get("q") as string).trim();
    const minPrice = formData.get("minPrice") as string;
    const maxPrice = formData.get("maxPrice") as string;

    onApply({
      q: q || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
  }

  return (
    <form
      key={`${filters.q ?? ""}-${filters.minPrice ?? ""}-${filters.maxPrice ?? ""}`}
      onSubmit={handleSubmit}
      className="border-border bg-card flex flex-wrap items-end gap-4 rounded-xl border p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-q" className="text-muted-foreground text-xs">
          Keyword
        </label>
        <input
          id="filter-q"
          name="q"
          type="text"
          defaultValue={filters.q ?? ""}
          placeholder="Title, city, address…"
          className={`${INPUT_CLASSNAME} w-48`}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="filter-category"
          className="text-muted-foreground text-xs"
        >
          Category
        </label>
        <select
          id="filter-category"
          value={filters.category ?? ""}
          onChange={(event) =>
            onApply({
              category: (event.target.value || undefined) as
                PropertyCategory | undefined,
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

      {/* Placed directly after Category, before Location/price: Sale-vs-Rent is
          the first cut most buyers make, and leaving it until after the price
          inputs would put it below the fold on a narrow viewport. */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="filter-listing-type"
          className="text-muted-foreground text-xs"
        >
          Listing type
        </label>
        <select
          id="filter-listing-type"
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
          {LISTING_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-city" className="text-muted-foreground text-xs">
          Location
        </label>
        <select
          id="filter-city"
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
          htmlFor="filter-min-price"
          className="text-muted-foreground text-xs"
        >
          Min price
        </label>
        <input
          id="filter-min-price"
          name="minPrice"
          type="number"
          min={0}
          inputMode="numeric"
          defaultValue={filters.minPrice ?? ""}
          className={INPUT_CLASSNAME}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="filter-max-price"
          className="text-muted-foreground text-xs"
        >
          Max price
        </label>
        <input
          id="filter-max-price"
          name="maxPrice"
          type="number"
          min={0}
          inputMode="numeric"
          defaultValue={filters.maxPrice ?? ""}
          className={INPUT_CLASSNAME}
        />
      </div>

      {(!filters.category || BEDROOM_CATEGORIES.includes(filters.category)) && (
        <div className="flex flex-col gap-1">
          <label
            htmlFor="filter-bedrooms"
            className="text-muted-foreground text-xs"
          >
            Bedrooms
          </label>
          <select
            id="filter-bedrooms"
            value={filters.minBedrooms ?? ""}
            onChange={(event) =>
              onApply({
                minBedrooms: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
            className={SELECT_CLASSNAME}
          >
            <option value="">Any</option>
            {BEDROOM_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count}+
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-sort" className="text-muted-foreground text-xs">
          Sort by
        </label>
        <select
          id="filter-sort"
          value={filters.sort ?? "newest"}
          onChange={(event) =>
            onApply({ sort: event.target.value as PropertySort })
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

      <Button type="submit" size="lg">
        Apply
      </Button>
    </form>
  );
}
