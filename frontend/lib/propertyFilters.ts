import type { FilterChip } from "@/components/common/FilterChips";
import {
  PROPERTY_CATEGORIES,
  type PropertyCategory,
} from "@/constants/categories";
import { formatPrice } from "@/lib/formatters";
import type { GetPropertiesParams, PropertySort } from "@/services";
import type { ListingType } from "@/types";

export type RawPropertySearchParams = Record<
  string,
  string | string[] | undefined
>;

const SORT_VALUES: PropertySort[] = ["newest", "price_asc", "price_desc"];

/**
 * The one Sale/Rent option list the public filter reads. Labels match what
 * `PropertyCard`/`PropertyDetailView` already print on a listing ("For Sale" /
 * "For Rent") so the filter a buyer picks and the badge they then see use the
 * same words.
 */
export const LISTING_TYPE_OPTIONS: { value: ListingType; label: string }[] = [
  { value: "SALE", label: "For Sale" },
  { value: "RENT", label: "For Rent" },
];

function isListingType(value: string): value is ListingType {
  return LISTING_TYPE_OPTIONS.some((option) => option.value === value);
}

/**
 * A sale price and a monthly rent are different units, so ordering a mixed list
 * by price ranks them against each other meaninglessly (before the Sale/Rent
 * filter existed, "Price: Low to High" put six rentals ahead of every sale
 * listing). Deliberately no price normalization — the data model has no rental
 * period or annualization field to derive one from, so the honest fix is to
 * tell the user the list is mixed and let them narrow it.
 */
export function hasMixedPriceComparison(filters: GetPropertiesParams): boolean {
  const sortsByPrice =
    filters.sort === "price_asc" || filters.sort === "price_desc";
  return sortsByPrice && !filters.listingType;
}

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
  const listingType = first(raw.listingType);
  const sort = first(raw.sort) as PropertySort | undefined;

  return {
    page: Math.max(1, Number(first(raw.page)) || 1),
    q: first(raw.q) || undefined,
    category: category && isPropertyCategory(category) ? category : undefined,
    listingType:
      listingType && isListingType(listingType) ? listingType : undefined,
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

  if (filters.listingType) {
    const option = LISTING_TYPE_OPTIONS.find(
      (item) => item.value === filters.listingType,
    );
    chips.push({
      key: "listingType",
      label: option?.label ?? filters.listingType,
    });
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
