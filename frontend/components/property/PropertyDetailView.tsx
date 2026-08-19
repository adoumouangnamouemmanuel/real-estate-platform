import { Bath, Bed, MessageCircle, Ruler } from "lucide-react";

import { ShareButton } from "@/components/common/ShareButton";
import { WhatsAppCTA } from "@/components/common/WhatsAppCTA";
import { DeveloperInfoCard } from "@/components/developer/DeveloperInfoCard";
import { MotionReveal, MotionRevealItem } from "@/components/motion";
import { FavoriteButton } from "@/components/property/FavoriteButton";
import { PropertyAmenities } from "@/components/property/PropertyAmenities";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyLocation } from "@/components/property/PropertyLocation";
import { PropertyMediaGallery } from "@/components/property/PropertyMediaGallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isFeatureEnabled } from "@/constants/features";
import { formatPrice } from "@/lib/formatters";
import { getPrimaryMeasurement } from "@/lib/propertyMeasurements";
import { formatPropertyLocation } from "@/lib/propertyLocation";
import type { ScoredProperty } from "@/lib/similarProperties";
import { buildWhatsAppMessage } from "@/lib/whatsapp";
import type { PropertyDetail } from "@/types";

interface PropertyDetailViewProps {
  property: PropertyDetail;
  relatedProperties: ScoredProperty[];
}

export function PropertyDetailView({
  property,
  relatedProperties,
}: PropertyDetailViewProps) {
  const measurement = getPrimaryMeasurement(property);
  return (
    <div className="container-page flex flex-col gap-10 py-10">
      <PropertyMediaGallery media={property.media} title={property.title} />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <MotionReveal as="header" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {property.listingType === "SALE" ? "For Sale" : "For Rent"}
                </Badge>
                <span className="text-muted-foreground text-sm">
                  {formatPropertyLocation(property)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShareButton title={property.title} className="size-11" />
                <FavoriteButton
                  propertyId={property.id}
                  propertyTitle={property.title}
                  size="lg"
                />
              </div>
            </div>
            <h1 className="text-page-title">{property.title}</h1>
            <p className="text-xl font-semibold">
              {formatPrice(property.price)}
              {property.listingType === "RENT" && (
                <span className="text-muted-foreground text-sm font-normal">
                  {" "}
                  / month
                </span>
              )}
            </p>

            {(property.bedrooms !== undefined ||
              property.bathrooms !== undefined ||
              measurement) && (
              <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                {property.bedrooms !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <Bed className="size-4" aria-hidden />
                    {property.bedrooms} Bedrooms
                  </span>
                )}
                {property.bathrooms !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <Bath className="size-4" aria-hidden />
                    {property.bathrooms} Bathrooms
                  </span>
                )}
                {measurement && (
                  <span className="flex items-center gap-1.5">
                    <Ruler className="size-4" aria-hidden />
                    {measurement.label}: {measurement.value} m²
                  </span>
                )}
              </div>
            )}
          </MotionReveal>

          <MotionReveal as="section" className="flex flex-col gap-2">
            <h2 className="text-subsection-title">Description</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {property.description}
            </p>
          </MotionReveal>

          {property.amenities.length > 0 && (
            <MotionReveal as="section" className="flex flex-col gap-2">
              <h2 className="text-subsection-title">Amenities</h2>
              <PropertyAmenities amenities={property.amenities} />
            </MotionReveal>
          )}

          <MotionReveal as="section" className="flex flex-col gap-2">
            <h2 className="text-subsection-title">Location</h2>
            <PropertyLocation property={property} />
          </MotionReveal>
        </div>

        {/* Sticky sidebar architecture preserved exactly — no motion wrapper
            on the <aside> itself, only within it, so lg:sticky positioning
            can't be affected by an in-flight transform. */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:h-fit lg:self-start">
          <h2 className="text-subsection-title">Contact</h2>
          <DeveloperInfoCard developer={property.developer} />
          {isFeatureEnabled("WHATSAPP_CONTACT") ? (
            <WhatsAppCTA message={buildWhatsAppMessage(property)} />
          ) : (
            <Button disabled className="gap-2">
              <MessageCircle aria-hidden />
              Contact on WhatsApp (coming soon)
            </Button>
          )}
        </aside>
      </div>

      {relatedProperties.length > 0 && (
        <MotionReveal as="section" className="flex flex-col gap-4">
          <h2 className="text-subsection-title">Similar Properties</h2>
          <MotionReveal
            stagger
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {relatedProperties.map((item) => (
              <MotionRevealItem key={item.id}>
                <PropertyCard
                  property={item}
                  reason={item.reason}
                  matchTags={item.tags}
                />
              </MotionRevealItem>
            ))}
          </MotionReveal>
        </MotionReveal>
      )}
    </div>
  );
}
