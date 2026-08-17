import type { PropertyCategory } from "@/constants/categories";
import {
  rankSimilarProperties,
  type ScoredProperty,
} from "@/lib/similarProperties";
import type {
  ListingType,
  PaginatedResult,
  Property,
  PropertyDetail,
} from "@/types";

import { MOCK_PROPERTIES } from "./mocks/properties.mock";

const DEFAULT_PAGE_SIZE = 12;
const MOCK_LATENCY_MS = 400;

export type PropertySort = "newest" | "price_asc" | "price_desc";

export interface PropertyFilters {
  q?: string;
  category?: PropertyCategory;
  /**
   * Sale vs. Rent. `listing_type` is a confirmed backend column (see
   * docs/PRODUCT_BACKEND_RECONCILIATION.md §6) and the developer's own
   * `GET /developers/me/listings` already filters on it — the public catalogue
   * simply never exposed it, so buyers and renters browsed one interleaved
   * list. TODO(backend): `GET /api/v1/properties` needs to accept this too;
   * docs/API_CONTRACT.md §3's params block predates it (contract addendum
   * proposed in CHANGELOG.md, not applied here).
   */
  listingType?: ListingType;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  /** Only meaningful for categories with bedrooms (House/Apartment) — ignored otherwise, see propertyFilters.ts. */
  minBedrooms?: number;
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
    if (filters.listingType && item.listingType !== filters.listingType)
      return false;
    if (filters.city && item.city !== filters.city) return false;
    if (filters.minPrice !== undefined && item.price < filters.minPrice)
      return false;
    if (filters.maxPrice !== undefined && item.price > filters.maxPrice)
      return false;
    if (
      filters.minBedrooms !== undefined &&
      (item.bedrooms ?? 0) < filters.minBedrooms
    )
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

  /**
   * Resolves an explicit set of property ids, preserving the order given.
   * Exists for Saved Properties: `favoriteService` owns *which* ids a browser
   * has saved (localStorage today) but knows nothing about properties, so the
   * catalogue resolves them — the same composition Analytics uses rather than
   * giving one service a second domain's data.
   *
   * Silently drops ids with no matching property: a saved listing can be
   * delisted or sold out from under a browser whose localStorage still names
   * it, and that should quietly disappear from the saved list, not error.
   *
   * TODO(backend): once `GET /favorites` exists (see favorite.service.ts) it
   * returns the properties directly and this composition collapses server-side.
   */
  getPropertiesByIds: (ids: string[]): Promise<Property[]> => {
    const byId = new Map(MOCK_PROPERTIES.map((item) => [item.id, item]));
    return delay(
      ids
        .map((id) => byId.get(id))
        .filter((item): item is PropertyDetail => item !== undefined),
    );
  },

  getPropertyBySlug: (slug: string): Promise<PropertyDetail> => {
    const property = MOCK_PROPERTIES.find((item) => item.slug === slug);
    return property
      ? delay(property)
      : Promise.reject(new Error("Property not found"));
  },

  /**
   * Deterministic, explainable similarity ranking (see lib/similarProperties.ts)
   * over the same-category candidate pool — never a machine-learning
   * recommendation, and never a claim of personalization the mock data
   * doesn't back up.
   */
  getRelatedProperties: (
    property: Property,
    limit = 4,
  ): Promise<ScoredProperty[]> => {
    const sameCategoryCandidates = MOCK_PROPERTIES.filter(
      (item) => item.category === property.category && item.id !== property.id,
    );
    return delay(
      rankSimilarProperties(property, sameCategoryCandidates, limit),
    );
  },
};
