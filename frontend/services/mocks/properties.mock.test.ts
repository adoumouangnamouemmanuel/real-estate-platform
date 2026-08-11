import { describe, expect, it } from "vitest";

import {
  getFeatureByName,
  getFeatureNamesForCategory,
} from "../feature.service";
import { MOCK_PROPERTIES } from "./properties.mock";

/**
 * Proves the migration off the legacy `constants/amenities.ts` (AMENITY_POOLS)
 * actually holds: every mock property's amenities must be real, resolvable
 * names from the canonical feature catalog, valid for that property's own
 * category — not an independently-seeded string that happens to look right.
 * If `services/mocks/properties.mock.ts` ever regresses to a hardcoded list
 * (or a typo'd name) that drifts from `services/mocks/features.mock.ts`,
 * this test catches it.
 */
describe("MOCK_PROPERTIES amenities", () => {
  it("resolves every property's amenities to real, category-valid feature catalog entries", () => {
    for (const property of MOCK_PROPERTIES) {
      const validNames = getFeatureNamesForCategory(property.category);

      for (const amenity of property.amenities) {
        expect(
          getFeatureByName(amenity),
          `"${amenity}" on property ${property.id} should resolve to a real feature catalog entry`,
        ).toBeDefined();

        expect(
          validNames,
          `"${amenity}" on property ${property.id} (${property.category}) should be offered for that category`,
        ).toContain(amenity);
      }
    }
  });

  it("seeds every property's amenities directly from the canonical catalog for its category", () => {
    for (const property of MOCK_PROPERTIES) {
      expect(property.amenities).toEqual(
        getFeatureNamesForCategory(property.category),
      );
    }
  });
});
