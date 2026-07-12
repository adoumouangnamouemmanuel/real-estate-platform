import { MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeveloperInfoCard } from "@/components/property/DeveloperInfoCard";
import { PropertyAmenities } from "@/components/property/PropertyAmenities";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyLocation } from "@/components/property/PropertyLocation";
import { PropertyMediaGallery } from "@/components/property/PropertyMediaGallery";
import { WhatsAppCTA } from "@/components/property/WhatsAppCTA";
import { isFeatureEnabled } from "@/constants/features";
import { formatPrice } from "@/lib/formatters";
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
          <header className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {property.listingType === "SALE" ? "For Sale" : "For Rent"}
              </Badge>
              <span className="text-muted-foreground text-sm">
                {property.city}, {property.region}
              </span>
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

        <aside className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Contact</h2>
          <DeveloperInfoCard developer={property.developer} />
          {isFeatureEnabled("WHATSAPP_CONTACT") ? (
            <WhatsAppCTA property={property} />
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
