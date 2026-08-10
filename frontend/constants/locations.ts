// TODO(backend): derive from distinct cities with active listings once GET /api/v1/properties exists.
export const CITIES = ["Accra", "Kumasi", "Takoradi", "Tema"] as const;

export type City = (typeof CITIES)[number];

// TODO(backend): replace with GET /api/v1/cities/:cityId/districts (or an
// equivalent districts-by-city query) once it exists.
/**
 * City → district lookup, mirroring the backend ER's `district` table
 * (`district.city_id` FK to `city`). Additive alongside the existing `region`
 * field on `Property` — not a replacement for it. `region` is
 * Ghana-region-scale (e.g. "Greater Accra"); `district` here is a finer,
 * city-scoped subdivision (e.g. a neighborhood/suburb within Accra). Whether
 * the product ultimately keeps both concepts or consolidates them is an open
 * decision — see docs/PRODUCT_BACKEND_RECONCILIATION.md §6/§18 — this mock
 * only establishes the City → District cascading-select UX the reconciliation
 * asked for, without guessing that resolution.
 */
export const DISTRICTS: Record<City, string[]> = {
  Accra: [
    "Osu",
    "East Legon",
    "Airport Residential",
    "Dansoman",
    "Tema Station",
  ],
  Kumasi: ["Adum", "Asokwa", "Nhyiaeso", "Suame"],
  Takoradi: ["Sekondi", "Effia", "Anaji"],
  Tema: ["Community 1", "Community 4", "Community 25"],
};

export function getDistrictsForCity(city: string | undefined): string[] {
  if (!city || !(city in DISTRICTS)) return [];
  return DISTRICTS[city as City];
}
