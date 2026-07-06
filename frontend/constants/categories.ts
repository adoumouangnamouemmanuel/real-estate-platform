export interface PropertyCategoryOption {
  value: string;
  label: string;
}

export const PROPERTY_CATEGORIES: PropertyCategoryOption[] = [
  { value: "apartment", label: "Apartments" },
  { value: "house", label: "Houses" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
  { value: "office", label: "Office Space" },
];
