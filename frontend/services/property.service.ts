import type { PropertyCategory } from "@/constants/categories";
import type { PaginatedResult, Property, PropertyDetail } from "@/types";

import { MOCK_PROPERTIES } from "./mocks/properties.mock";

const DEFAULT_PAGE_SIZE = 12;
const MOCK_LATENCY_MS = 400;

export type PropertySort = "newest" | "price_asc" | "price_desc";

export interface PropertyFilters {
  q?: string;
  category?: PropertyCategory;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: PropertySort;
}

export interface GetPropertiesParams extends PropertyFilters {
  page?: number;
  pageSize?: number;
}

function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  };
}

// Mirrors the WHERE-clause shape in docs/ARCHITECTURE.md §10 (city ILIKE, priceMax, plainto_tsquery)
// so swapping this for the real endpoint later is a query-building change, not a filter redesign.
function filterProperties(
  items: PropertyDetail[],
  filters: PropertyFilters,
): PropertyDetail[] {
  return items.filter((item) => {
    if (filters.category && item.category !== filters.category) return false;
    if (filters.city && item.city !== filters.city) return false;
    if (filters.minPrice !== undefined && item.price < filters.minPrice)
      return false;
    if (filters.maxPrice !== undefined && item.price > filters.maxPrice)
      return false;

    if (filters.q) {
      const haystack =
        `${item.title} ${item.description} ${item.city} ${item.address}`.toLowerCase();
      if (!haystack.includes(filters.q.toLowerCase())) return false;
    }

    return true;
  });
}

function sortProperties(
  items: PropertyDetail[],
  sort?: PropertySort,
): PropertyDetail[] {
  if (sort === "price_asc") return [...items].sort((a, b) => a.price - b.price);
  if (sort === "price_desc")
    return [...items].sort((a, b) => b.price - a.price);
  return items;
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(value), MOCK_LATENCY_MS),
  );
}

export const propertyService = {
  getProperties: ({
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    ...filters
  }: GetPropertiesParams = {}): Promise<PaginatedResult<Property>> => {
    const results = sortProperties(
      filterProperties(MOCK_PROPERTIES, filters),
      filters.sort,
    );
    return delay(paginate(results, page, pageSize));
  },

  getPropertyBySlug: (slug: string): Promise<PropertyDetail> => {
    const property = MOCK_PROPERTIES.find((item) => item.slug === slug);
    return property
      ? delay(property)
      : Promise.reject(new Error("Property not found"));
  },

  getRelatedProperties: (
    property: Pick<Property, "id" | "category">,
    limit = 4,
  ): Promise<Property[]> =>
    delay(
      MOCK_PROPERTIES.filter(
        (item) =>
          item.category === property.category && item.id !== property.id,
      ).slice(0, limit),
    ),
};
