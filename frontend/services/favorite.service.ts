import { api } from "@/lib/api";
import type { ApiResponse } from "@/types";

export interface FavoritesState {
  ids: string[];
  countDeltas: Record<string, number>;
}

/**
 * Saved-properties seam. Reads/writes through the backend's
 * `GET /favorites` and `POST /favorites/:propertyId` endpoints.
 */
export const favoriteService = {
  getState: (): Promise<FavoritesState> =>
    api
      .get<ApiResponse<FavoritesState>>("/favorites")
      .then((res) => res.data.data),

  toggleFavorite: (propertyId: string): Promise<FavoritesState> =>
    api
      .post<ApiResponse<FavoritesState>>(`/favorites/${propertyId}`)
      .then((res) => res.data.data),
};
