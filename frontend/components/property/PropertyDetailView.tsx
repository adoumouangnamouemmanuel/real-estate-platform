import { Bath, Bed, MessageCircle, Ruler } from "lucide-react";

import { ShareButton } from "@/components/common/ShareButton";
import { WhatsAppCTA } from "@/components/common/WhatsAppCTA";
import { DeveloperInfoCard } from "@/components/developer/DeveloperInfoCard";
import { FavoriteButton } from "@/components/property/FavoriteButton";
import { PropertyAmenities } from "@/components/property/PropertyAmenities";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyLocation } from "@/components/property/PropertyLocation";
import { PropertyMediaGallery } from "@/components/property/PropertyMediaGallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isFeatureEnabled } from "@/constants/features";
import { formatPrice } from "@/lib/formatters";
import { buildWhatsAppMessage } from "@/lib/whatsapp";
import type { Property, PropertyDetail } from "@/types";

interface PropertyDetailViewProps {
  property: PropertyDetail;
  relatedProperties: Property[];
}

export function PropertyDetailView({
  property,
  relatedProperties,
}: PropertyDetailViewProps) {
  return (
    <div className="container-page flex flex-col gap-10 py-10">
      <PropertyMediaGallery media={property.media} title={property.title} />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {property.listingType === "SALE" ? "For Sale" : "For Rent"}
                </Badge>
                <span className="text-muted-foreground text-sm">
                  {property.city}, {property.region}
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
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {property.title}
            </h1>
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
              property.areaSqm !== undefined) && (
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
                {property.areaSqm !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <Ruler className="size-4" aria-hidden />
                    {property.areaSqm} m²
                  </span>
                )}
              </div>
            )}
          </header>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Description</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {property.description}
            </p>
          </section>

          {property.amenities.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">Amenities</h2>
              <PropertyAmenities amenities={property.amenities} />
            </section>
          )}

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Location</h2>
            <PropertyLocation property={property} />
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:h-fit lg:self-start">
          <h2 className="text-lg font-semibold">Contact</h2>
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
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Similar Properties</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProperties.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
