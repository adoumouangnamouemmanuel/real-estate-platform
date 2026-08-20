import { ArrowLeft, Bath, Bed, Ruler } from "lucide-react";
import Link from "next/link";

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
import { ROUTES } from "@/constants/routes";
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
  const hasKeyFacts =
    property.bedrooms !== undefined ||
    property.bathrooms !== undefined ||
    Boolean(measurement);

  return (
    <div className="container-page flex flex-col gap-10 py-8">
      <Link
        href={ROUTES.PROPERTIES}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 -mb-2 inline-flex w-fit items-center gap-1.5 rounded-sm text-sm transition-colors outline-none focus-visible:ring-3"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to properties
      </Link>

      {/*
        Explicit grid placement rather than source order. The measured problem
        was that a full-width 16/9 gallery is 621px tall at 1440 — with the
        61px navbar that consumed the entire 900px viewport, leaving the title
        at y=914, the price at 967 and the only contact action at 950. The
        first screen of a property page showed a photo and the word "Contact".

        The gallery now shares the fold with the decision panel instead of
        displacing it: at lg the gallery takes two of three columns (~410px
        tall) and the panel sits beside it carrying identity, price, key facts
        and the contact action. Row placement keeps the panel spanning both
        rows so `sticky` still tracks the reading column.

        Below lg the grid collapses to one column and DOM order decides, which
        is why the panel is written second — mobile then reads gallery →
        identity/price/contact → description, instead of burying the contact
        action at y=1431 as it did before.
      */}
      <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-3">
        <div className="lg:col-span-2 lg:row-start-1">
          <PropertyMediaGallery media={property.media} title={property.title} />
        </div>

        {/*
          Deliberately not wrapped in MotionReveal. Measured at 1440x900 the
          old header sat outside the viewport on load, so `whileInView` left
          the h1 at opacity 0 — the property's identity was not merely below
          the fold, it was unpainted. Above-the-fold identity does not animate
          in; this is the same rule applied to the developer profile header.
        */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:h-fit lg:self-start">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {property.listingType === "SALE" ? "For Sale" : "For Rent"}
              </Badge>
              <span className="text-muted-foreground text-sm">
                {formatPropertyLocation(property)}
              </span>
            </div>

            <h1 className="font-display text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
              {property.title}
            </h1>

            {/* Price is the second thing a buyer looks for and was rendering at
                20px — smaller than a section heading. Raised to the display
                face so it reads as a headline figure, not body copy. */}
            <p className="font-display text-3xl leading-none font-semibold tracking-tight">
              {formatPrice(property.price)}
              {property.listingType === "RENT" && (
                <span className="text-muted-foreground text-sm font-normal">
                  {" "}
                  / month
                </span>
              )}
            </p>

            {hasKeyFacts && (
              <div className="text-muted-foreground border-border flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-sm">
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

            <div className="flex items-center gap-2">
              <FavoriteButton
                propertyId={property.id}
                propertyTitle={property.title}
                size="lg"
              />
              <ShareButton title={property.title} className="size-11" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-subsection-title">Contact</h2>
            <DeveloperInfoCard developer={property.developer} />
            {/* Rendered only when the flag is on. It previously fell back to a
                disabled "Contact on WhatsApp (coming soon)" button, which both
                advertised a capability the product does not have and sat in the
                visual slot the one working contact action should occupy. */}
            {isFeatureEnabled("WHATSAPP_CONTACT") && (
              <WhatsAppCTA message={buildWhatsAppMessage(property)} />
            )}
          </div>
        </aside>

        <div className="flex flex-col gap-8 lg:col-span-2 lg:row-start-2">
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
      </div>

      {relatedProperties.length > 0 && (
        <MotionReveal as="section" className="flex flex-col gap-4">
          <h2 className="text-subsection-title">Similar properties</h2>
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
