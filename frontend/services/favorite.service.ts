const MOCK_LATENCY_MS = 250;
const FAVORITE_IDS_STORAGE_KEY = "lumavok:favorite-property-ids";
const FAVORITE_DELTAS_STORAGE_KEY = "lumavok:favorite-count-deltas";

export interface FavoritesState {
  /** Property ids the current browser has saved. */
  ids: string[];
  /**
   * Per-property adjustment to `Property.favoriteCount` from toggling in
   * *this* browser — kept separate from the mock catalogue's own seeded
   * count (see `services/mocks/properties.mock.ts`) so a real backend's
   * `COUNT(*)` aggregate isn't something this service pretends to own.
   */
  countDeltas: Record<string, number>;
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(value), MOCK_LATENCY_MS),
  );
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function readState(): FavoritesState {
  return {
    ids: readJSON<string[]>(FAVORITE_IDS_STORAGE_KEY, []),
    countDeltas: readJSON<Record<string, number>>(
      FAVORITE_DELTAS_STORAGE_KEY,
      {},
    ),
  };
}

/**
 * Saved-properties seam. TODO(backend): replace with `GET /favorites` (list),
 * `POST /favorites/:propertyId`, `DELETE /favorites/:propertyId` once they
 * exist — see the `PropertyFavorite` entity already in ARCHITECTURE.md §5's
 * ER diagram. Persisted to `localStorage` today, not a real account-scoped
 * list, since saving a property doesn't require an account (the homepage's
 * own "browse with no account" promise) — a real backend would key this off
 * the authenticated user when logged in, and fall back to a session id for
 * anonymous saves. `favoriteCount` on `Property` is the mock catalogue's
 * seeded baseline (what "everyone else" has saved); `countDeltas` here is
 * only this browser's own contribution on top of it — a real backend
 * collapses both into one real `COUNT(*)` column and this file disappears.
 */
export const favoriteService = {
  getState: (): Promise<FavoritesState> => delay(readState()),

  toggleFavorite: (propertyId: string): Promise<FavoritesState> => {
    const state = readState();
    const ids = new Set(state.ids);
    const willFavorite = !ids.has(propertyId);

    if (willFavorite) ids.add(propertyId);
    else ids.delete(propertyId);

    const countDeltas = { ...state.countDeltas };
    countDeltas[propertyId] =
      (countDeltas[propertyId] ?? 0) + (willFavorite ? 1 : -1);

    const next: FavoritesState = { ids: [...ids], countDeltas };
    writeJSON(FAVORITE_IDS_STORAGE_KEY, next.ids);
    writeJSON(FAVORITE_DELTAS_STORAGE_KEY, next.countDeltas);

    return delay(next);
  },
};
