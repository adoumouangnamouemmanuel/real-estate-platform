import { Building2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { formatPrice } from "@/lib/formatters";
import type { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const coverImage = property.media[0];

  return (
    <Link
      href={ROUTES.PROPERTY_DETAIL(property.slug)}
      className="group border-border hover:border-primary/40 flex flex-col overflow-hidden rounded-lg border transition-colors"
    >
      <div className="bg-muted relative aspect-[4/3] w-full">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={property.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center">
            <Building2 className="size-8" aria-hidden />
          </div>
        )}
        <Badge
          variant="outline"
          className="bg-background/90 absolute top-2 left-2 border-0"
        >
          {property.listingType === "SALE" ? "For Sale" : "For Rent"}
        </Badge>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="truncate text-sm font-medium">{property.title}</p>
        <p className="text-muted-foreground truncate text-xs">
          {property.city}, {property.region}
        </p>
        <p className="text-sm font-semibold">{formatPrice(property.price)}</p>
      </div>
    </Link>
  );
}
