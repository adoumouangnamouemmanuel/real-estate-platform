import {
  ArrowUpDown,
  Car,
  ChefHat,
  Check,
  Droplet,
  Fence,
  FileCheck,
  Home,
  Shield,
  Sun,
  Trees,
  Truck,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * One place mapping a `Feature.iconName` (mirrors the backend ER's
 * `feature.icon_name` column) to the actual lucide-react component — shared
 * by the Property Editor's amenity chips and Property Detail's amenity list,
 * so both render the same icon for the same feature. Falls back to a plain
 * `Check` for any icon name not in this map (e.g. a future feature added
 * server-side before the frontend catalog is updated to match).
 */
export const FEATURE_ICON: Record<string, LucideIcon> = {
  Shield,
  Zap,
  ChefHat,
  Sun,
  Car,
  Trees,
  Home,
  Fence,
  Droplet,
  FileCheck,
  Truck,
  ArrowUpDown,
  Wind,
};

export function getFeatureIcon(iconName: string | undefined): LucideIcon {
  return (iconName && FEATURE_ICON[iconName]) || Check;
}
