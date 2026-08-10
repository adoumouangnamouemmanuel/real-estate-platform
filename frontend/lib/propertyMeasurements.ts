import type { Property } from "@/types";

/**
 * The one category-aware measurement to show for a property — LAND shows its
 * land size, everything else shows building size. Falls back to the
 * deprecated generic `areaSqm` for older mock records that predate the split
 * (see `Property.areaSqm`'s doc comment in types/index.ts), so nothing in the
 * UI silently loses a value it used to show.
 */
export function getPrimaryMeasurement(
  property: Pick<
    Property,
    "category" | "landSizeSqm" | "buildingSizeSqm" | "areaSqm"
  >,
): { label: string; value: number } | undefined {
  if (property.category === "land") {
    const value = property.landSizeSqm ?? property.areaSqm;
    return value !== undefined ? { label: "Land size", value } : undefined;
  }

  const value = property.buildingSizeSqm ?? property.areaSqm;
  return value !== undefined ? { label: "Building size", value } : undefined;
}
