import { api } from "@/lib/api";
import type { PropertyCategory } from "@/constants/categories";
import type { Feature, ApiResponse } from "@/types";

/**
 * The one source of truth for the property feature/amenity catalog.
 * The Property Editor's amenities section reads through this today;
 * Property Detail's amenity-name-to-icon lookup reads the same catalog.
 */
export const featureService = {
  getFeatures: (category?: PropertyCategory): Promise<Feature[]> =>
    api
      .get<ApiResponse<Feature[]>>("/features", {
        params: category ? { category } : undefined,
      })
      .then((res) => res.data.data),
};

/**
 * Synchronous lookup for display-only contexts (Property Detail, Property Card)
 * that already have a feature *name* stored on the property and just need its
 * icon/category. Populated once from the API on module load.
 */
let cachedFeatures: Feature[] | null = null;

featureService.getFeatures().then((features) => {
  cachedFeatures = features;
});

export function getFeatureByName(name: string): Feature | undefined {
  return cachedFeatures?.find((feature) => feature.name === name);
}

/**
 * Synchronous helper — returns feature names for a given property category.
 * Used by test fixtures (services/mocks/properties.mock.ts) to seed property
 * amenities from the real catalog rather than maintaining an independent list.
 */
export function getFeatureNamesForCategory(
  category: PropertyCategory,
): string[] {
  return (cachedFeatures ?? [])
    .filter((feature) => feature.propertyCategories.includes(category))
    .map((feature) => feature.name);
}
