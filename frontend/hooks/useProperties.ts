"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useFavoritesState } from "@/hooks/useFavorites";
import { propertyService, type GetPropertiesParams } from "@/services";

export const PROPERTIES_KEY = ["properties"] as const;

/** Keeps the previous page's data visible while the next page loads, instead of flashing skeletons on every click. */
export function useProperties(params: GetPropertiesParams = {}) {
  return useQuery({
    queryKey: [...PROPERTIES_KEY, params],
    queryFn: () => propertyService.getProperties(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * The Saved Properties list: which ids are saved comes from `favoriteService`
 * (this browser's localStorage), the properties themselves from the catalogue.
 * Composed here rather than given to either service, so neither grows a second
 * domain's data — the same split `analytics.service.ts` already uses.
 *
 * `placeholderData` matters more here than on the catalogue: unsaving a card
 * changes the id list, which changes this query's key, and without it every
 * removal would blank the whole grid to skeletons for a frame.
 */
export function useSavedProperties() {
  const favorites = useFavoritesState();
  const ids = favorites.data?.ids ?? [];

  const properties = useQuery({
    queryKey: [...PROPERTIES_KEY, "saved", ids],
    queryFn: () => propertyService.getPropertiesByIds(ids),
    enabled: favorites.isSuccess,
    placeholderData: keepPreviousData,
  });

  return {
    properties: properties.data ?? [],
    savedCount: ids.length,
    // Favorites must resolve before the property query can even start, so
    // "loading" has to cover both or the empty state flashes in between.
    isLoading:
      favorites.isLoading || (favorites.isSuccess && properties.isLoading),
    isError: favorites.isError || properties.isError,
    error: favorites.error ?? properties.error,
  };
}
