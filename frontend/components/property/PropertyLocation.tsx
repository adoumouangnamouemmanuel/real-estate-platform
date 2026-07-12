import { MapPin } from "lucide-react";

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

      {!isFeatureEnabled("PROPERTY_MAP") && (
        <div className="border-border text-muted-foreground flex h-40 items-center justify-center rounded-lg border border-dashed text-sm">
          Map view coming soon
        </div>
      )}
    </div>
  );
}
