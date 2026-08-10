import type { Feature } from "@/types";

// TODO(backend): replace with GET /api/v1/features once it exists — mirrors
// the ER's `feature` table (feature_name, category, icon_name). Per-category
// eligibility (`propertyCategories` below) is frontend-owned product logic
// layered on top, not a backend concept: the ER's `property_feature` join has
// no category constraint of its own. This replaces the old AMENITY_POOLS
// hardcoded string map as the one source of truth (Property Editor, Property
// Detail, and any future Property Card/Filter consumer all read this catalog,
// never a component-local list).
export const MOCK_FEATURES: Feature[] = [
  {
    id: "security-24-7",
    name: "24/7 Security",
    category: "Security",
    iconName: "Shield",
    propertyCategories: ["house", "apartment", "commercial"],
  },
  {
    id: "backup-generator",
    name: "Backup Generator",
    category: "Utilities",
    iconName: "Zap",
    propertyCategories: ["house", "apartment", "commercial", "office"],
  },
  {
    id: "fitted-kitchen",
    name: "Fitted Kitchen",
    category: "Interior",
    iconName: "ChefHat",
    propertyCategories: ["apartment"],
  },
  {
    id: "balcony",
    name: "Balcony",
    category: "Interior",
    iconName: "Sun",
    propertyCategories: ["apartment"],
  },
  {
    id: "parking",
    name: "Parking",
    category: "Outdoor",
    iconName: "Car",
    propertyCategories: ["apartment", "house"],
  },
  {
    id: "garden",
    name: "Garden",
    category: "Outdoor",
    iconName: "Trees",
    propertyCategories: ["house"],
  },
  {
    id: "boys-quarters",
    name: "Boys' Quarters",
    category: "Interior",
    iconName: "Home",
    propertyCategories: ["house"],
  },
  {
    id: "gated-community",
    name: "Gated Community",
    category: "Land",
    iconName: "Fence",
    propertyCategories: ["land"],
  },
  {
    id: "electricity-access",
    name: "Electricity Access",
    category: "Land",
    iconName: "Zap",
    propertyCategories: ["land"],
  },
  {
    id: "water-access",
    name: "Water Access",
    category: "Land",
    iconName: "Droplet",
    propertyCategories: ["land"],
  },
  {
    id: "registered-title",
    name: "Registered Title",
    category: "Land",
    iconName: "FileCheck",
    propertyCategories: ["land"],
  },
  {
    id: "loading-bay",
    name: "Loading Bay",
    category: "Commercial",
    iconName: "Truck",
    propertyCategories: ["commercial"],
  },
  {
    id: "ample-parking",
    name: "Ample Parking",
    category: "Commercial",
    iconName: "Car",
    propertyCategories: ["commercial"],
  },
  {
    id: "elevator-access",
    name: "Elevator Access",
    category: "Building",
    iconName: "ArrowUpDown",
    propertyCategories: ["office"],
  },
  {
    id: "air-conditioning",
    name: "Air Conditioning",
    category: "Building",
    iconName: "Wind",
    propertyCategories: ["office"],
  },
];
