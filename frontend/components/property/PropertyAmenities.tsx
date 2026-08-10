import { getFeatureIcon } from "@/lib/featureIcons";
import { getFeatureByName } from "@/services";

interface PropertyAmenitiesProps {
  amenities: string[];
}

/** Reads the shared feature catalog (services/feature.service.ts) to render each amenity's real icon — the same catalog the Property Editor's picker draws from, so an amenity never shows a different icon in two places. */
export function PropertyAmenities({ amenities }: PropertyAmenitiesProps) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {amenities.map((amenity) => {
        const Icon = getFeatureIcon(getFeatureByName(amenity)?.iconName);
        return (
          <li key={amenity} className="flex items-center gap-2 text-sm">
            <Icon className="text-primary size-4 shrink-0" aria-hidden />
            {amenity}
          </li>
        );
      })}
    </ul>
  );
}
