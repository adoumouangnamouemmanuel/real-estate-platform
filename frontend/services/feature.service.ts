import type { PropertyCategory } from "@/constants/categories";
import type { Feature } from "@/types";

import { MOCK_FEATURES } from "./mocks/features.mock";

const MOCK_LATENCY_MS = 150;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(value), MOCK_LATENCY_MS),
  );
}

/**
 * The one source of truth for the property feature/amenity catalog. The
 * Property Editor's amenities section reads through this today; Property
 * Detail's amenity-name-to-icon lookup (`getFeatureByName`) reads the same
 * underlying catalog, so both surfaces can never drift out of sync the way
 * two independent hardcoded lists could.
 *
 * TODO(backend): replace with GET /api/v1/features once it exists, mirroring
 * the ER's `feature` table.
 */
export const featureService = {
  getFeatures: (category?: PropertyCategory): Promise<Feature[]> =>
    delay(
      category
        ? MOCK_FEATURES.filter((feature) =>
            feature.propertyCategories.includes(category),
          )
        : MOCK_FEATURES,
    ),
};

/** Synchronous lookup for display-only contexts (Property Detail, Property Card) that already have a feature *name* stored on the property and just need its icon/category — not worth a network round-trip for. */
export function getFeatureByName(name: string): Feature | undefined {
  return MOCK_FEATURES.find((feature) => feature.name === name);
}

/**
 * Synchronous, mock-fixture-only helper — lets `services/mocks/properties.mock.ts`
 * seed a property's `amenities: string[]` from this catalog's names instead of
 * maintaining an independent taxonomy (the old `constants/amenities.ts`
 * AMENITY_POOLS this catalog replaced). Not part of the async `featureService`
 * surface real components call: this exists purely so fixture data has a
 * single place to draw category-appropriate names from, same as
 * `getFeatureByName` exists purely for synchronous display lookups.
 */
export function getFeatureNamesForCategory(
  category: PropertyCategory,
): string[] {
  return MOCK_FEATURES.filter((feature) =>
    feature.propertyCategories.includes(category),
  ).map((feature) => feature.name);
}
