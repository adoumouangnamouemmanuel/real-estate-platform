import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Home as HomeIcon,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  Trees,
  Warehouse,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";

import { PropertyCard } from "@/components/property/PropertyCard";
import { buttonVariants } from "@/components/ui/button";
import { SearchBar } from "@/components/search/SearchBar";
import {
  PROPERTY_CATEGORIES,
  type PropertyCategory,
} from "@/constants/categories";
import { ROUTES } from "@/constants/routes";
import { getCategoryImageUrl, HERO_IMAGE_URL } from "@/lib/demoImagery";
import { propertyService } from "@/services";
import type { Property } from "@/types";

const CATEGORY_ICONS: Record<
  PropertyCategory,
  ComponentType<{ className?: string }>
> = {
  apartment: Building2,
  house: HomeIcon,
  land: Trees,
  commercial: Warehouse,
  office: Briefcase,
};

/** Properties buyers are saving the most — see services/favorite.service.ts for the mock signal this reads. */
function sortByPopularity(properties: Property[]): Property[] {
  return [...properties].sort(
    (a, b) => (b.favoriteCount ?? 0) - (a.favoriteCount ?? 0),
  );
}

export default async function Home() {
  // TODO(backend): "featured" should come from GET /api/v1/properties?featured=true
  // once that flag exists; today it's just the newest page. The second fetch
  // (pageSize 100) is a mock-scale-only stand-in for what a real backend
  // would expose as GET /properties?sort=popular and GET /properties?category=land
  // directly — see analytics.service.ts for the identical "fetch enough rows
  // to derive views client-side" pattern and its own caveat about this not
  // surviving real data volume.
  const [featuredResult, catalogueResult] = await Promise.all([
    propertyService.getProperties({ pageSize: 8 }),
    propertyService.getProperties({ pageSize: 100 }),
  ]);

  const featured = featuredResult.items;
  const trending = sortByPopularity(catalogueResult.items).slice(0, 4);
  const landOpportunities = catalogueResult.items
    .filter((property) => property.category === "land")
    .slice(0, 3);

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative flex min-h-[560px] items-center justify-center overflow-hidden">
        <Image
          src={HERO_IMAGE_URL}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25"
        />

        <div className="container-page relative flex flex-col items-center gap-6 py-24 text-center text-white">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Find your next home, verified developers, WhatsApp away.
          </h1>
          <p className="max-w-xl text-white/85">
            Browse properties from verified developers across African markets —
            no account required.
          </p>
          <SearchBar />
        </div>
      </section>

      <section className="container-page flex flex-col gap-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">
          Explore by category
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {PROPERTY_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.value];
            return (
              <Link
                key={category.value}
                href={`${ROUTES.PROPERTIES}?category=${category.value}`}
                className="group ring-border relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-xl ring-1"
              >
                <Image
                  src={getCategoryImageUrl(category.value)}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"
                />
                <div className="relative flex items-center gap-2 p-3 text-white">
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="text-sm font-medium">{category.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-page flex flex-col gap-6 py-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Featured Properties
          </h2>
          <Link
            href={ROUTES.PROPERTIES}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
          >
            View all
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      {trending.length > 0 && (
        <section className="container-page flex flex-col gap-6 py-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-brand-gold size-5" aria-hidden />
              <h2 className="text-2xl font-semibold tracking-tight">
                Trending Now
              </h2>
            </div>
            <p className="text-muted-foreground text-sm">
              The properties buyers are saving the most.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trending.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </section>
      )}

      {landOpportunities.length > 0 && (
        <section className="container-page flex flex-col gap-6 py-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            Land Opportunities
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {landOpportunities.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </section>
      )}

      <section className="bg-muted/40 py-16">
        <div className="container-page grid gap-8 sm:grid-cols-3">
          <TrustPoint
            icon={BadgeCheck}
            title="Verified developers"
            description="Every developer is vetted before their listings go live."
          />
          <TrustPoint
            icon={MessageCircle}
            title="Direct WhatsApp contact"
            description="Message developers directly — no middlemen, no hidden fees."
          />
          <TrustPoint
            icon={ShieldCheck}
            title="Transparent listings"
            description="Real prices and real locations, so there are no surprises at viewing."
          />
        </div>
      </section>

      <section className="container-page flex flex-col items-center gap-4 py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Ready to find your next property?
        </h2>
        <p className="text-muted-foreground max-w-md">
          Browse listings from verified developers across Ghana&apos;s biggest
          markets — houses, apartments, land, and commercial space.
        </p>
        <Link
          href={ROUTES.PROPERTIES}
          className={buttonVariants({ size: "lg" })}
        >
          Browse Properties
        </Link>
      </section>
    </div>
  );
}

interface TrustPointProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function TrustPoint({ icon: Icon, title, description }: TrustPointProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
      <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
        <Icon className="size-5" aria-hidden />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
