import { PROPERTY_STATUS_LABEL } from "@/components/dashboard/StatusBadge";
import type { FilterChip } from "@/components/common/FilterChips";
import {
  PROPERTY_CATEGORIES,
  type PropertyCategory,
} from "@/constants/categories";
import type { GetListingsParams, ListingSort } from "@/services";
import type { ListingType, PropertyStatus } from "@/types";

export type RawListingSearchParams = Record<
  string,
  string | string[] | undefined
>;

const SORT_VALUES: ListingSort[] = [
  "updated_desc",
  "price_asc",
  "price_desc",
  "title_asc",
];
const STATUS_VALUES: PropertyStatus[] = [
  "ACTIVE",
  "RESERVED",
  "SOLD",
  "DRAFT",
  "SUSPENDED",
];
const LISTING_TYPE_VALUES: ListingType[] = ["SALE", "RENT"];
const PAGE_SIZE_VALUES = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

export const LISTING_STATUS_OPTIONS: {
  value: PropertyStatus;
  label: string;
}[] = STATUS_VALUES.map((value) => ({
  value,
  label: PROPERTY_STATUS_LABEL[value],
}));

export const LISTING_SORT_OPTIONS: { value: ListingSort; label: string }[] = [
  { value: "updated_desc", label: "Recently updated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "title_asc", label: "Title: A to Z" },
];

export const LISTING_PAGE_SIZE_OPTIONS = PAGE_SIZE_VALUES;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isPropertyCategory(value: string): value is PropertyCategory {
  return PROPERTY_CATEGORIES.some((option) => option.value === value);
}

/** The one place /listings parses the URL into typed filters. */
export function parseListingFilters(
  raw: RawListingSearchParams,
): GetListingsParams {
  const status = first(raw.status) as PropertyStatus | undefined;
  const category = first(raw.category);
  const listingType = first(raw.listingType) as ListingType | undefined;
  const sort = first(raw.sort) as ListingSort | undefined;
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
    category: category && isPropertyCategory(category) ? category : undefined,
    listingType:
      listingType && LISTING_TYPE_VALUES.includes(listingType)
        ? listingType
        : undefined,
    sort: sort && SORT_VALUES.includes(sort) ? sort : undefined,
  };
}

/** Builds the active-filter chip list for FilterChips from the current URL-derived filters. */
export function buildListingFilterChips(
  filters: GetListingsParams,
): FilterChip<keyof GetListingsParams>[] {
  const chips: FilterChip<keyof GetListingsParams>[] = [];

  if (filters.q) chips.push({ key: "q", label: `"${filters.q}"` });

  if (filters.status) {
    chips.push({ key: "status", label: PROPERTY_STATUS_LABEL[filters.status] });
  }

  if (filters.category) {
    const category = PROPERTY_CATEGORIES.find(
      (option) => option.value === filters.category,
    );
    chips.push({ key: "category", label: category?.label ?? filters.category });
  }

  if (filters.listingType) {
    chips.push({
      key: "listingType",
      label: filters.listingType === "SALE" ? "For Sale" : "For Rent",
    });
  }

  return chips;
}
