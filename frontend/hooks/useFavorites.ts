"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { favoriteService, type FavoritesState } from "@/services";

const FAVORITES_KEY = ["favorites"] as const;

/**
 * One query for the whole browser's saved-properties state — never
 * refetched on an interval (unlike Notifications' unread count) since
 * nothing outside this browser can change it. `staleTime: Infinity` because
 * the only way this data changes is through `useToggleFavorite`, which
 * already keeps the cache in sync via its optimistic update.
 */
export function useFavoritesState() {
  return useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: favoriteService.getState,
    staleTime: Infinity,
  });
}

export function useIsFavorited(propertyId: string): boolean {
  const { data } = useFavoritesState();
  return data?.ids.includes(propertyId) ?? false;
}

/** `baselineCount` is the mock catalogue's own seeded `Property.favoriteCount` — see favorite.service.ts. */
export function useFavoriteCount(
  propertyId: string,
  baselineCount = 0,
): number {
  const { data } = useFavoritesState();
  return baselineCount + (data?.countDeltas[propertyId] ?? 0);
}

/**
 * The first optimistic mutation in this codebase (every other domain
 * invalidates-after-success instead — see the Platform Readiness Review).
 * Deliberate exception: toggling a favorite is a purely local,
 * never-fails, no-meaningful-latency action, so waiting for a round trip
 * before the heart fills in would only ever look like lag, never protect
 * against a real failure mode.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (propertyId: string) =>
      favoriteService.toggleFavorite(propertyId),
    onMutate: async (propertyId: string) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_KEY });
      const previous = queryClient.getQueryData<FavoritesState>(FAVORITES_KEY);

      const ids = new Set(previous?.ids ?? []);
      const willFavorite = !ids.has(propertyId);
      if (willFavorite) ids.add(propertyId);
      else ids.delete(propertyId);

      const countDeltas = { ...(previous?.countDeltas ?? {}) };
      countDeltas[propertyId] =
        (countDeltas[propertyId] ?? 0) + (willFavorite ? 1 : -1);

      queryClient.setQueryData<FavoritesState>(FAVORITES_KEY, {
        ids: [...ids],
        countDeltas,
      });

      return { previous };
    },
    onError: (_error, _propertyId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FAVORITES_KEY, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: FAVORITES_KEY });
    },
  });
}
