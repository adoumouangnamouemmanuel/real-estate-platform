import { MapPin } from "lucide-react";

import { MapPlaceholder } from "@/components/common/MapPlaceholder";
import { isFeatureEnabled } from "@/constants/features";
import type { PropertyDetail } from "@/types";

interface PropertyLocationProps {
  property: PropertyDetail;
}

export function PropertyLocation({ property }: PropertyLocationProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-start gap-2 text-sm">
        <MapPin
          className="text-muted-foreground mt-0.5 size-4 shrink-0"
          aria-hidden
        />
        <span>
          {property.address}, {property.city}, {property.region}
        </span>
      </p>

      {!isFeatureEnabled("MAP_VIEW") && <MapPlaceholder />}
    </div>
  );
}
