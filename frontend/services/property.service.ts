import { api } from "@/lib/api";
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
  ApiResponse,
} from "@/types";

const DEFAULT_PAGE_SIZE = 12;

export type PropertySort = "newest" | "price_asc" | "price_desc";

export interface PropertyFilters {
  q?: string;
  category?: PropertyCategory;
  listingType?: ListingType;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  sort?: PropertySort;
}

export interface GetPropertiesParams extends PropertyFilters {
  page?: number;
  pageSize?: number;
}

export const propertyService = {
  getProperties: ({
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    ...filters
  }: GetPropertiesParams = {}): Promise<PaginatedResult<Property>> => {
    const params: Record<string, string | number> = { page, pageSize };
    if (filters.q) params.q = filters.q;
    if (filters.category) params.category = filters.category;
    if (filters.listingType) params.listingType = filters.listingType;
    if (filters.city) params.city = filters.city;
    if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
    if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
    if (filters.minBedrooms !== undefined)
      params.minBedrooms = filters.minBedrooms;
    if (filters.sort) params.sort = filters.sort;

    return api
      .get<ApiResponse<PaginatedResult<Property>>>("/properties", { params })
      .then((res) => res.data.data);
  },

  getPropertiesByIds: (ids: string[]): Promise<Property[]> => {
    if (ids.length === 0) return Promise.resolve([]);
    return Promise.all(
      ids.map((id) =>
        api
          .get<ApiResponse<Property>>(`/properties/${id}`)
          .then((res) => res.data.data)
          .catch(() => null),
      ),
    ).then((results) => results.filter((p): p is Property => p !== null));
  },

  getPropertyBySlug: (slug: string): Promise<PropertyDetail> =>
    api
      .get<ApiResponse<PropertyDetail>>(`/properties/${slug}`)
      .then((res) => res.data.data),

  /**
   * The backend returns same-category properties; we apply client-side
   * similarity scoring (reason + tags) on top.
   */
  getRelatedProperties: (
    property: Property,
    limit = 4,
  ): Promise<ScoredProperty[]> =>
    api
      .get<ApiResponse<Property[]>>(`/properties/${property.id}/related`, {
        params: { limit },
      })
      .then((res) => rankSimilarProperties(property, res.data.data, limit)),
};
