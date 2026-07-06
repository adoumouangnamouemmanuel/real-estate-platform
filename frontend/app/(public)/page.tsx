import Link from "next/link";

import { PropertyCard } from "@/components/property/PropertyCard";
import { SearchBar } from "@/components/search/SearchBar";
import { PROPERTY_CATEGORIES } from "@/constants/categories";
import { ROUTES } from "@/constants/routes";
import type { Property } from "@/types";

// Mock data — replace with a React Query hook against GET /api/v1/properties?featured=true
// once the backend endpoint exists.
const FEATURED_PROPERTIES: Property[] = [
  {
    id: "1",
    slug: "luxury-3br-apartment-east-legon",
    title: "Luxury 3BR Apartment in East Legon",
    description: "A modern 3-bedroom apartment with a private balcony.",
    price: 450000,
    listingType: "SALE",
    category: "apartment",
    city: "Accra",
    region: "Greater Accra",
    status: "ACTIVE",
    media: [],
  },
  {
    id: "2",
    slug: "modern-2br-house-airport-residential",
    title: "Modern 2BR House, Airport Residential",
    description: "A quiet 2-bedroom house close to the airport.",
    price: 3500,
    listingType: "RENT",
    category: "house",
    city: "Accra",
    region: "Greater Accra",
    status: "ACTIVE",
    media: [],
  },
  {
    id: "3",
    slug: "commercial-plot-tema-industrial-area",
    title: "Commercial Plot, Tema Industrial Area",
    description: "A serviced commercial plot suitable for warehousing.",
    price: 900000,
    listingType: "SALE",
    category: "commercial",
    city: "Tema",
    region: "Greater Accra",
    status: "ACTIVE",
    media: [],
  },
  {
    id: "4",
    slug: "office-space-osu-oxford-street",
    title: "Office Space, Osu Oxford Street",
    description: "A furnished office space on Oxford Street.",
    price: 5200,
    listingType: "RENT",
    category: "office",
    city: "Accra",
    region: "Greater Accra",
    status: "ACTIVE",
    media: [],
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="container-page flex flex-col items-center gap-6 py-16 text-center sm:py-24">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Find your next home, verified developers, WhatsApp away.
        </h1>
        <p className="text-muted-foreground max-w-xl">
          Browse properties from verified developers across African markets — no
          account required.
        </p>
        <SearchBar />
      </section>

      <section className="container-page flex flex-wrap justify-center gap-3 pb-12">
        {PROPERTY_CATEGORIES.map((category) => (
          <Link
            key={category.value}
            href={`${ROUTES.PROPERTIES}?category=${category.value}`}
            className="border-border text-muted-foreground hover:border-primary/40 hover:text-foreground rounded-full border px-4 py-1.5 text-sm transition-colors"
          >
            {category.label}
          </Link>
        ))}
      </section>

      <section className="container-page flex flex-col gap-6 pb-16">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Featured Properties</h2>
          <Link
            href={ROUTES.PROPERTIES}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_PROPERTIES.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>
    </div>
  );
}
