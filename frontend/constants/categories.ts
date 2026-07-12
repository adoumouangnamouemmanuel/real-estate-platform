export interface PropertyCategoryOption {
  value: string;
  label: string;
}

export const PROPERTY_CATEGORIES = [
  { value: "apartment", label: "Apartments" },
  { value: "house", label: "Houses" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
  { value: "office", label: "Office Space" },
] as const satisfies PropertyCategoryOption[];

/** Derived from PROPERTY_CATEGORIES so a typo'd category can't silently type-check. */
export type PropertyCategory = (typeof PROPERTY_CATEGORIES)[number]["value"];
