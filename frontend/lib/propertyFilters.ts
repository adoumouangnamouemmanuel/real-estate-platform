import {
  PROPERTY_CATEGORIES,
  type PropertyCategory,
} from "@/constants/categories";
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
    sort: sort && SORT_VALUES.includes(sort) ? sort : undefined,
  };
}
