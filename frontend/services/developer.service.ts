import { api } from "@/lib/api";
import type {
  Developer,
  DeveloperProfile,
  PaginatedResult,
  Property,
  ApiResponse,
} from "@/types";

const DEFAULT_PAGE_SIZE = 12;

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

export const developerService = {
  getDevelopers: ({
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    ...filters
  }: GetDevelopersParams = {}): Promise<PaginatedResult<Developer>> => {
    const params: Record<string, string | number> = { page, pageSize };
    if (filters.q) params.q = filters.q;
    if (filters.city) params.city = filters.city;
    if (filters.sort) params.sort = filters.sort;

    return api
      .get<ApiResponse<PaginatedResult<Developer>>>("/developers", { params })
      .then((res) => res.data.data);
  },

  getDeveloperBySlug: (slug: string): Promise<DeveloperProfile> =>
    api
      .get<ApiResponse<DeveloperProfile>>(`/developers/${slug}`)
      .then((res) => res.data.data),

  getDeveloperListings: (
    developerId: string,
    {
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
    }: { page?: number; pageSize?: number } = {},
  ): Promise<PaginatedResult<Property>> =>
    api
      .get<ApiResponse<PaginatedResult<Property>>>(
        `/developers/${developerId}/listings`,
        { params: { page, pageSize } },
      )
      .then((res) => res.data.data),
};
