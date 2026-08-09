"use client";

import { Bath, Bed, Building2, MapPin, Ruler, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/property/FavoriteButton";
import { ROUTES } from "@/constants/routes";
import { useFavoriteCount } from "@/hooks/useFavorites";
import { formatPrice } from "@/lib/formatters";
import type { Property } from "@/types";

/** Above this, a property earns a "Popular" signal on its card — see favoriteService for what backs the count. */
const POPULAR_THRESHOLD = 100;

interface PropertyCardProps {
  property: Property;
  /** Only the first visible row of cards should eagerly load — see PropertyGrid/homepage callers. */
  priority?: boolean;
}

export function PropertyCard({
  property,
  priority = false,
}: PropertyCardProps) {
  const coverImage = property.media[0];
  const favoriteCount = useFavoriteCount(
    property.id,
    property.favoriteCount ?? 0,
  );
  const isPopular = favoriteCount >= POPULAR_THRESHOLD;

  return (
    <article className="group bg-card ring-border relative flex flex-col overflow-hidden rounded-xl ring-1 transition-shadow duration-300 hover:shadow-lg">
      {/*
        A normal block-level flex container, not `display: contents` — a
        `contents` element has no box of its own, which left Playwright (and
        potentially real pointer/touch input) computing a click point outside
        the visible card and missing the link entirely. FavoriteButton stays
        correctly on top as an absolutely-positioned sibling regardless.
      */}
      <Link
        href={ROUTES.PROPERTY_DETAIL(property.slug)}
        className="flex flex-1 flex-col"
      >
        <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden">
          {coverImage ? (
            <Image
              src={coverImage.url}
              alt={property.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              priority={priority}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center">
              <Building2 className="size-8" aria-hidden />
            </div>
          )}

          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <Badge className="bg-background/90 text-foreground border-0 backdrop-blur-sm">
              {property.listingType === "SALE" ? "For Sale" : "For Rent"}
            </Badge>
            {isPopular && (
              <Badge className="bg-brand-gold text-brand-gold-foreground border-0">
                <TrendingUp className="size-3" aria-hidden />
                Popular
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <p className="font-heading truncate text-[0.95rem] font-semibold tracking-tight">
            {property.title}
          </p>

          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {property.city}, {property.region}
            </span>
          </p>

          {(property.bedrooms !== undefined ||
            property.bathrooms !== undefined ||
            property.areaSqm !== undefined) && (
            <div className="text-muted-foreground flex items-center gap-3 text-xs">
              {property.bedrooms !== undefined && (
                <span className="flex items-center gap-1">
                  <Bed className="size-3.5" aria-hidden />
                  {property.bedrooms} bd
                </span>
              )}
              {property.bathrooms !== undefined && (
                <span className="flex items-center gap-1">
                  <Bath className="size-3.5" aria-hidden />
                  {property.bathrooms} ba
                </span>
              )}
              {property.areaSqm !== undefined && (
                <span className="flex items-center gap-1">
                  <Ruler className="size-3.5" aria-hidden />
                  {property.areaSqm} m²
                </span>
              )}
            </div>
          )}

          <p className="mt-auto pt-1 text-base font-semibold tracking-tight">
            {formatPrice(property.price)}
            {property.listingType === "RENT" && (
              <span className="text-muted-foreground text-xs font-normal">
                {" "}
                /mo
              </span>
            )}
          </p>
        </div>
      </Link>

      <FavoriteButton
        propertyId={property.id}
        propertyTitle={property.title}
        className="absolute top-3 right-3 z-10"
      />
    </article>
  );
}
