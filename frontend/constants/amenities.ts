import type { PropertyCategory } from "@/constants/categories";

/**
 * The amenity taxonomy per property category — the public catalogue's mock
 * properties draw from this, and the Property Editor's amenities section
 * offers exactly this list as checkboxes (not freeform text), so listing data
 * stays consistent with what the public site already filters/displays on.
 */
export const AMENITY_POOLS: Record<PropertyCategory, string[]> = {
  apartment: [
    "24/7 Security",
    "Backup Generator",
    "Fitted Kitchen",
    "Balcony",
    "Parking",
  ],
  house: [
    "24/7 Security",
    "Backup Generator",
    "Garden",
    "Parking",
    "Boys' Quarters",
  ],
  land: [
    "Gated Community",
    "Electricity Access",
    "Water Access",
    "Registered Title",
  ],
  commercial: [
    "Loading Bay",
    "Backup Generator",
    "24/7 Security",
    "Ample Parking",
  ],
  office: [
    "Elevator Access",
    "Backup Generator",
    "24/7 Security",
    "Air Conditioning",
  ],
};
