import type { FilterChip } from "@/components/common/FilterChips";
import {
  PROPERTY_CATEGORIES,
  type PropertyCategory,
} from "@/constants/categories";
import { formatPrice } from "@/lib/formatters";
import type { GetPropertiesParams, PropertySort } from "@/services";

export type RawPropertySearchParams = Record<
  string,
  string | string[] | undefined
>;

const SORT_VALUES: PropertySort[] = ["newest", "price_asc", "price_desc"];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isPropertyCategory(value: string): value is PropertyCategory {
  return PROPERTY_CATEGORIES.some((option) => option.value === value);
}

function parsePrice(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** The one place /properties and /search parse the URL into typed filters, so the two routes can't drift. */
export function parsePropertyFilters(
  raw: RawPropertySearchParams,
): GetPropertiesParams {
  const category = first(raw.category);
  const sort = first(raw.sort) as PropertySort | undefined;

  return {
    page: Math.max(1, Number(first(raw.page)) || 1),
    q: first(raw.q) || undefined,
    category: category && isPropertyCategory(category) ? category : undefined,
    city: first(raw.city) || undefined,
    minPrice: parsePrice(first(raw.minPrice)),
    maxPrice: parsePrice(first(raw.maxPrice)),
    minBedrooms: parsePrice(first(raw.minBedrooms)),
    sort: sort && SORT_VALUES.includes(sort) ? sort : undefined,
  };
}

/** Categories that have a bedrooms concept at all — the bedrooms filter only makes sense to show for these, mirroring ListingMeasurementsSection's category-conditional fields. */
export const BEDROOM_CATEGORIES: PropertyCategory[] = ["house", "apartment"];

/** Builds the active-filter chip list for FilterChips from the current URL-derived filters. */
export function buildPropertyFilterChips(
  filters: GetPropertiesParams,
): FilterChip<keyof GetPropertiesParams>[] {
  const chips: FilterChip<keyof GetPropertiesParams>[] = [];

  if (filters.q) chips.push({ key: "q", label: `"${filters.q}"` });

  if (filters.category) {
    const category = PROPERTY_CATEGORIES.find(
      (option) => option.value === filters.category,
    );
    chips.push({ key: "category", label: category?.label ?? filters.category });
  }

  if (filters.city) chips.push({ key: "city", label: filters.city });

  if (filters.minPrice !== undefined) {
    chips.push({
      key: "minPrice",
      label: `Min ${formatPrice(filters.minPrice)}`,
    });
  }

  if (filters.maxPrice !== undefined) {
    chips.push({
      key: "maxPrice",
      label: `Max ${formatPrice(filters.maxPrice)}`,
    });
  }

  if (filters.minBedrooms !== undefined) {
    chips.push({
      key: "minBedrooms",
      label: `${filters.minBedrooms}+ bedrooms`,
    });
  }

  return chips;
}
