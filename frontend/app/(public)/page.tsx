import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Home as HomeIcon,
  ShieldCheck,
  TrendingUp,
  Trees,
  Warehouse,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";

import {
  ImageCrossfade,
  MotionImage,
  MotionReveal,
  MotionRevealItem,
} from "@/components/motion";
import { PropertyCard } from "@/components/property/PropertyCard";
import { buttonVariants } from "@/components/ui/button";
import { SearchBar } from "@/components/search/SearchBar";
import {
  PROPERTY_CATEGORIES,
  type PropertyCategory,
} from "@/constants/categories";
import { ROUTES } from "@/constants/routes";
import { getContactTrustPoint } from "@/lib/contactTrustPoint";
import { getCategoryImageUrl, HERO_IMAGES } from "@/lib/demoImagery";
import { cn } from "@/lib/utils";
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

/**
 * Mobile: a horizontal snap rail, so a three-card section costs one card of
 * vertical height instead of three. sm and up: an ordinary grid. Used only for
 * the two secondary sections — the primary inventory below the hero stays a
 * vertical grid, because burying the main catalogue behind a sideways swipe
 * would be worse discovery, not better.
 */
const RAIL =
  "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:snap-none sm:overflow-visible sm:pb-0";
const RAIL_ITEM = "min-w-[78%] snap-start sm:min-w-0";

export default async function Home() {
  // One fetch, one pool. Previously this made two requests and each section
  // sliced the results independently, so the same property could headline three
  // different sections — 15 card slots rendered only 10 distinct properties.
  //
  // TODO(backend): sections are still derived client-side from a single page of
  // results. A real backend would expose GET /properties?sort=popular and
  // ?category=land directly — see analytics.service.ts for the identical
  // "fetch enough rows to derive the view client-side" pattern and its own
  // caveat about not surviving real data volume. There is deliberately no
  // `featured` flag here, because the backend has none.
  const { items: catalogue } = await propertyService.getProperties({
    pageSize: 100,
  });

  // Sections claim their properties in order of how specific their claim is,
  // and a property is only ever claimed once. Trending goes first because
  // "what buyers are saving most" is a falsifiable statement about a specific
  // property; the newest-listings rail is the least specific, so it takes
  // whatever is left rather than crowding out the sections that mean something.
  const claimed = new Set<string>();
  function claim(candidates: Property[], count: number): Property[] {
    const picked = candidates
      .filter((property) => !claimed.has(property.id))
      .slice(0, count);
    picked.forEach((property) => claimed.add(property.id));
    return picked;
  }

  const trending = claim(sortByPopularity(catalogue), 3);
  const landOpportunities = claim(
    catalogue.filter((property) => property.category === "land"),
    3,
  );
  const latest = claim(catalogue, 6);

  // A section that can't fill its grid is hidden rather than padded. Three is
  // the width of the secondary grids; four keeps the main grid from rendering
  // as a stranded single row.
  const showTrending = trending.length >= 3;
  const showLand = landOpportunities.length >= 3;
  const showLatest = latest.length >= 4;

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero height is set so the section below breaks the fold at 1440x900:
          64px of navbar plus 600px of hero leaves the next section's heading
          and the top of its cards visible, which is what tells a first-time
          visitor the page is a catalogue rather than a landing page. */}
      <section className="relative flex min-h-[520px] items-center justify-center overflow-hidden sm:min-h-[560px] lg:min-h-[600px]">
        <ImageCrossfade images={HERO_IMAGES} className="absolute inset-0" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25"
        />

        <MotionReveal
          stagger
          className="container-page relative flex flex-col items-center gap-6 py-16 text-center text-white"
        >
          <MotionRevealItem
            as="h1"
            className="font-display max-w-2xl text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl"
          >
            Find your next home across African markets.
          </MotionRevealItem>
          <MotionRevealItem as="p" className="max-w-xl text-white/85">
            Browse real listings from real developers — no account required.
          </MotionRevealItem>
          <MotionRevealItem className="flex w-full max-w-xl justify-center">
            <SearchBar variant="glass" />
          </MotionRevealItem>
          {/* The exploratory path out of the hero, for the visitor who has no
              search term in mind. Solid white rather than a translucent glass
              button so its contrast is deterministic over the photograph
              behind it, and visually distinct from the search bar's primary
              button so the two actions don't compete.

              Wrapped in cn() rather than passing these through
              buttonVariants({ className }): cva concatenates without resolving
              conflicts, so the default variant's `text-primary-foreground`
              (a near-white) survived alongside `text-neutral-900` and won on
              stylesheet order — white text on a white button. cn()'s
              tailwind-merge drops the losing `text-*` so the override holds. */}
          <MotionRevealItem>
            <Link
              href={ROUTES.PROPERTIES}
              className={cn(
                buttonVariants({ size: "lg" }),
                "gap-2 bg-white text-neutral-900 hover:bg-white/90 focus-visible:ring-white/50",
              )}
            >
              Browse properties
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </MotionRevealItem>
        </MotionReveal>
      </section>

      <section className="container-page page-section flex flex-col gap-6">
        <h2 className="text-section-title">Explore by category</h2>
        <MotionReveal
          stagger
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
        >
          {PROPERTY_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.value];
            return (
              <MotionRevealItem key={category.value}>
                <Link
                  href={`${ROUTES.PROPERTIES}?category=${category.value}`}
                  className="ring-border relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-xl ring-1"
                >
                  <MotionImage className="absolute inset-0">
                    <Image
                      src={getCategoryImageUrl(category.value)}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover"
                    />
                  </MotionImage>
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"
                  />
                  <div className="relative flex items-center gap-2 p-3 text-white">
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="text-sm font-medium">
                      {category.label}
                    </span>
                  </div>
                </Link>
              </MotionRevealItem>
            );
          })}
        </MotionReveal>
      </section>

      {/* "Latest listings", not "Featured": nothing on this platform is
          featured. There is no featured flag in the data model or the backend
          contract, and this section is literally the newest page of results —
          so it says so. */}
      {showLatest && (
        <MotionReveal
          as="section"
          className="container-page page-section flex flex-col gap-6"
        >
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-section-title">Latest listings</h2>
            <Link
              href={ROUTES.PROPERTIES}
              className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 text-sm transition-colors"
            >
              View all
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </MotionReveal>
      )}

      {showTrending && (
        <MotionReveal
          as="section"
          className="container-page page-section flex flex-col gap-6"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-brand-gold size-5" aria-hidden />
              <h2 className="text-section-title">Trending now</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              The properties buyers are saving the most.
            </p>
          </div>
          <div
            className={`${RAIL} sm:grid-cols-3`}
            tabIndex={0}
            role="group"
            aria-label="Trending properties"
          >
            {trending.map((property) => (
              <div key={property.id} className={RAIL_ITEM}>
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        </MotionReveal>
      )}

      {showLand && (
        <MotionReveal
          as="section"
          className="container-page page-section flex flex-col gap-6"
        >
          <h2 className="text-section-title">Land opportunities</h2>
          <div
            className={`${RAIL} sm:grid-cols-3`}
            tabIndex={0}
            role="group"
            aria-label="Land opportunities"
          >
            {landOpportunities.map((property) => (
              <div key={property.id} className={RAIL_ITEM}>
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        </MotionReveal>
      )}

      <section className="bg-muted/40">
        <MotionReveal
          stagger
          className="container-page page-section grid gap-8 sm:grid-cols-3"
        >
          <MotionRevealItem>
            <TrustPoint
              icon={BadgeCheck}
              title="Developer verification"
              description="Look for the verified badge — it means we've reviewed that developer."
            />
          </MotionRevealItem>
          {/* Copy is chosen from the same flag the real WhatsApp CTAs read —
              see lib/contactTrustPoint.ts. */}
          <MotionRevealItem>
            <TrustPoint {...getContactTrustPoint()} />
          </MotionRevealItem>
          <MotionRevealItem>
            <TrustPoint
              icon={ShieldCheck}
              title="Transparent listings"
              description="Real prices and real locations, so there are no surprises at viewing."
            />
          </MotionRevealItem>
        </MotionReveal>
      </section>

      <MotionReveal
        as="section"
        className="container-page page-section flex flex-col items-center gap-4 text-center"
      >
        <h2 className="text-section-title">
          Ready to find your next property?
        </h2>
        <p className="text-muted-foreground max-w-md">
          Browse listings across Ghana&apos;s biggest markets — houses,
          apartments, land, and commercial space.
        </p>
        <Link
          href={ROUTES.PROPERTIES}
          className={buttonVariants({ size: "lg" })}
        >
          Browse Properties
        </Link>
      </MotionReveal>
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
