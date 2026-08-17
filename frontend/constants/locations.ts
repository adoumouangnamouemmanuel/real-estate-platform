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

// TODO(backend): replace with the region/administrative area the real `city`
// table carries, once GET /api/v1/cities exists. The ER's `city` table has no
// region column today (see docs/PRODUCT_BACKEND_RECONCILIATION.md §3), which is
// precisely why this stays a frontend-only display derivation.
/**
 * City → region, for the four cities the editor actually offers.
 *
 * **Not a resolution of the region-vs-district question** (§6/§18 Q4, still
 * open): `region` remains its own concept, distinct from `district`, and
 * nothing here renames or merges them. This exists only so the Property Editor
 * stops asking a developer to hand-type a value into a free-text box that has
 * no backend column to land in — and stops *blocking publication* on it.
 *
 * Derived from, not invented for, the existing data: every one of the 46 mock
 * property/listing records agrees on these pairings, with no contradictions
 * (Accra and Tema → Greater Accra, Kumasi → Ashanti, Takoradi → Western). Since
 * `CITIES` is a closed list and the editor's city field is a select over it, the
 * mapping is total for anything a developer can now choose.
 *
 * Legacy records whose city predates `CITIES` (e.g. "Ada Foah") resolve to
 * undefined here — callers must fall back to the region already stored on the
 * record rather than blanking it.
 */
export const CITY_REGIONS: Record<City, string> = {
  Accra: "Greater Accra",
  Kumasi: "Ashanti",
  Takoradi: "Western",
  Tema: "Greater Accra",
};

export function getRegionForCity(city: string | undefined): string | undefined {
  if (!city || !(city in CITY_REGIONS)) return undefined;
  return CITY_REGIONS[city as City];
}
