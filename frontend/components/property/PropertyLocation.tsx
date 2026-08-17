import { MapPin } from "lucide-react";

import { MapPlaceholder } from "@/components/common/MapPlaceholder";
import { isFeatureEnabled } from "@/constants/features";
import { buildPropertyLocationLines } from "@/lib/propertyLocation";
import type { PropertyDetail } from "@/types";

interface PropertyLocationProps {
  property: PropertyDetail;
}

export function PropertyLocation({ property }: PropertyLocationProps) {
  const lines = buildPropertyLocationLines(property);

  return (
    <div className="flex flex-col gap-3">
      {/*
        The place stack, most specific first — address, then district (when the
        listing has one), then city and region. Rendered as an address block
        rather than a comma-joined sentence so the hierarchy is legible; the
        first line is the street address and carries the emphasis.
      */}
      <p className="flex items-start gap-2 text-sm">
        <MapPin
          className="text-muted-foreground mt-0.5 size-4 shrink-0"
          aria-hidden
        />
        <span className="flex flex-col">
          {lines.map((line, index) => (
            <span
              key={line}
              className={index === 0 ? undefined : "text-muted-foreground"}
            >
              {line}
            </span>
          ))}
        </span>
      </p>

      {!isFeatureEnabled("MAP_VIEW") && <MapPlaceholder />}
    </div>
  );
}
