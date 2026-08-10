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
