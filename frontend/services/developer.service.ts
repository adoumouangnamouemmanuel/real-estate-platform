import type {
  Developer,
  DeveloperProfile,
  PaginatedResult,
  Property,
} from "@/types";

import { MOCK_DEVELOPERS } from "./mocks/developers.mock";
import { MOCK_PROPERTIES } from "./mocks/properties.mock";

const DEFAULT_PAGE_SIZE = 12;
const MOCK_LATENCY_MS = 400;

export type DeveloperSort = "rating_desc" | "name_asc" | "listings_desc";

export interface DeveloperFilters {
  q?: string;
  city?: string;
  sort?: DeveloperSort;
}

export interface GetDevelopersParams extends DeveloperFilters {
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

function filterDevelopers(
  items: DeveloperProfile[],
  filters: DeveloperFilters,
): DeveloperProfile[] {
  return items.filter((item) => {
    if (filters.city && item.city !== filters.city) return false;

    if (filters.q) {
      const haystack = `${item.name} ${item.city} ${item.bio}`.toLowerCase();
      if (!haystack.includes(filters.q.toLowerCase())) return false;
    }

    return true;
  });
}

function sortDevelopers(
  items: DeveloperProfile[],
  sort?: DeveloperSort,
): DeveloperProfile[] {
  if (sort === "name_asc")
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "listings_desc")
    return [...items].sort((a, b) => b.activeListings - a.activeListings);
  // Default (and "rating_desc"): highest-rated first, unrated developers last.
  return [...items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(value), MOCK_LATENCY_MS),
  );
}

// TODO(backend): replace with GET /api/v1/developers once the endpoint exists.
export const developerService = {
  getDevelopers: ({
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    ...filters
  }: GetDevelopersParams = {}): Promise<PaginatedResult<Developer>> => {
    const results = sortDevelopers(
      filterDevelopers(MOCK_DEVELOPERS, filters),
      filters.sort,
    );
    return delay(paginate(results, page, pageSize));
  },

  getDeveloperBySlug: (slug: string): Promise<DeveloperProfile> => {
    const developer = MOCK_DEVELOPERS.find((item) => item.slug === slug);
    return developer
      ? delay(developer)
      : Promise.reject(new Error("Developer not found"));
  },

  getDeveloperListings: (
    developerId: string,
    {
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
    }: { page?: number; pageSize?: number } = {},
  ): Promise<PaginatedResult<Property>> => {
    const listings = MOCK_PROPERTIES.filter(
      (item) => item.developer.id === developerId,
    );
    return delay(paginate(listings, page, pageSize));
  },

  getFeaturedListings: (developerId: string, limit = 4): Promise<Property[]> =>
    delay(
      MOCK_PROPERTIES.filter((item) => item.developer.id === developerId)
        .sort((a, b) => b.price - a.price)
        .slice(0, limit),
    ),
};
