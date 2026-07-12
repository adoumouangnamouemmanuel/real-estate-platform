import { Check } from "lucide-react";

interface PropertyAmenitiesProps {
  amenities: string[];
}

export function PropertyAmenities({ amenities }: PropertyAmenitiesProps) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {amenities.map((amenity) => (
        <li key={amenity} className="flex items-center gap-2 text-sm">
          <Check className="text-primary size-4 shrink-0" aria-hidden />
          {amenity}
        </li>
      ))}
    </ul>
  );
}
