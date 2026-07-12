import type { PropertyCategory } from "@/constants/categories";
import { buildWhatsAppMessage } from "@/lib/whatsapp";
import type {
  DeveloperSummary,
  PaginatedResult,
  Property,
  PropertyDetail,
} from "@/types";

const DEFAULT_PAGE_SIZE = 12;
const MOCK_LATENCY_MS = 400;

const DEVELOPERS = {
  atlantic: {
    id: "d1",
    slug: "atlantic-properties",
    name: "Atlantic Properties",
    isVerified: true,
    rating: 4.6,
  },
  goldcrest: {
    id: "d2",
    slug: "goldcrest-homes",
    name: "Goldcrest Homes",
    isVerified: true,
    rating: 4.2,
  },
  westgate: {
    id: "d3",
    slug: "westgate-developers",
    name: "Westgate Developers",
    isVerified: false,
    rating: 3.8,
  },
} satisfies Record<string, DeveloperSummary>;

const AMENITY_POOLS: Record<PropertyCategory, string[]> = {
  apartment: [
    "24/7 Security",
    "Backup Generator",
    "Fitted Kitchen",
    "Balcony",
    "Parking",
  ],
  house: [
    "24/7 Security",
    "Backup Generator",
    "Garden",
    "Parking",
    "Boys' Quarters",
  ],
  land: [
    "Gated Community",
    "Electricity Access",
    "Water Access",
    "Registered Title",
  ],
  commercial: [
    "Loading Bay",
    "Backup Generator",
    "24/7 Security",
    "Ample Parking",
  ],
  office: [
    "Elevator Access",
    "Backup Generator",
    "24/7 Security",
    "Air Conditioning",
  ],
};

// TODO(backend): replace with GET /api/v1/properties once the endpoint exists
// (see docs/ARCHITECTURE.md §10 for the query contract this should match).
const MOCK_PROPERTIES: PropertyDetail[] = [
  {
    id: "p1",
    slug: "luxury-3br-apartment-east-legon",
    title: "Luxury 3BR Apartment in East Legon",
    description:
      "A modern 3-bedroom apartment with a private balcony and secure parking.",
    price: 450000,
    listingType: "SALE",
    category: "apartment",
    city: "Accra",
    region: "Greater Accra",
    address: "14 Adjei Kojo Street, East Legon",
    status: "ACTIVE",
    media: [],
    amenities: AMENITY_POOLS.apartment,
    developer: DEVELOPERS.atlantic,
  },
  {
    id: "p2",
    slug: "modern-2br-house-airport-residential",
    title: "Modern 2BR House, Airport Residential",
    description: "A quiet 2-bedroom house close to the airport.",
    price: 3500,
    listingType: "RENT",
    category: "house",
    city: "Accra",
    region: "Greater Accra",
    address: "9 Volta Street, Airport Residential",
    status: "ACTIVE",
    media: [],
    amenities: AMENITY_POOLS.house,
    developer: DEVELOPERS.goldcrest,
  },
  {
    id: "p3",
    slug: "commercial-plot-tema-industrial-area",
    title: "Commercial Plot, Tema Industrial Area",
    description: "A serviced commercial plot suitable for warehousing.",
    price: 900000,
    listingType: "SALE",
    category: "commercial",
    city: "Tema",
    region: "Greater Accra",
    address: "Plot 22, Tema Industrial Area",
    status: "ACTIVE",
    media: [],
    amenities: AMENITY_POOLS.commercial,
    developer: DEVELOPERS.westgate,
  },
  {
    id: "p4",
    slug: "office-space-osu-oxford-street",
    title: "Office Space, Osu Oxford Street",
    description: "A furnished office space on Oxford Street.",
    price: 5200,
    listingType: "RENT",
    category: "office",
    city: "Accra",
    region: "Greater Accra",
    address: "31 Oxford Street, Osu",
    status: "ACTIVE",
    media: [],
    amenities: AMENITY_POOLS.office,
    developer: DEVELOPERS.atlantic,
  },
  {
    id: "p5",
    slug: "residential-land-ahodwo-kumasi",
    title: "Residential Land, Ahodwo",
    description: "A gated 80x100 plot in a fast-developing neighborhood.",
    price: 120000,
    listingType: "SALE",
    category: "land",
    city: "Kumasi",
    region: "Ashanti",
    address: "Ahodwo Estates, Plot 14",
    status: "ACTIVE",
    media: [],
    amenities: AMENITY_POOLS.land,
    developer: DEVELOPERS.goldcrest,
  },
  {
    id: "p6",
    slug: "1br-apartment-nhyiaeso-kumasi",
    title: "1BR Apartment, Nhyiaeso",
    description: "Compact, newly built apartment near the city center.",
    price: 2200,
    listingType: "RENT",
    category: "apartment",
    city: "Kumasi",
    region: "Ashanti",
    address: "6 Nhyiaeso Road, Kumasi",
    status: "ACTIVE",
    media: [],
    amenities: AMENITY_POOLS.apartment,
    developer: DEVELOPERS.westgate,
  },
  {
    id: "p7",
    slug: "4br-house-beach-road-takoradi",
    title: "4BR House, Beach Road",
    description: "Spacious family home a short walk from the beach.",
    price: 380000,
    listingType: "SALE",
    category: "house",
    city: "Takoradi",
    region: "Western",
    address: "18 Beach Road, Takoradi",
    status: "ACTIVE",
    media: [],
    amenities: AMENITY_POOLS.house,
    developer: DEVELOPERS.atlantic,
  },
  {
    id: "p8",
    slug: "5br-townhouse-cantonments",
    title: "5BR Townhouse, Cantonments",
    description: "Executive townhouse with a private pool and BQ.",
    price: 620000,
    listingType: "SALE",
    category: "apartment",
    city: "Accra",
    region: "Greater Accra",
    address: "4 Cantonments Road, Accra",
    status: "ACTIVE",
    media: [],
    amenities: AMENITY_POOLS.apartment,
    developer: DEVELOPERS.goldcrest,
  },
  {
    id: "p9",
    slug: "residential-land-adenta",
    title: "Residential Land, Adenta",
    description: "Registered 60x100 plot, walking distance to the main road.",
    price: 250000,
    listingType: "SALE",
    category: "land",
    city: "Accra",
    region: "Greater Accra",
    address: "Adenta SSNIT Flats Extension, Plot 7",
    status: "ACTIVE",
    media: [],
    amenities: AMENITY_POOLS.land,
    developer: DEVELOPERS.westgate,
  },
  {
    id: "p10",
    slug: "3br-house-ridge-kumasi",
    title: "3BR House, Ridge",
    description: "Renovated colonial-style home in a leafy neighborhood.",
    price: 2800,
    listingType: "RENT",
    category: "house",
    city: "Kumasi",
    region: "Ashanti",
    address: "11 Ridge Avenue, Kumasi",
    status: "ACTIVE",
    media: [],
    amenities: AMENITY_POOLS.house,
    developer: DEVELOPERS.atlantic,
  },
  {
    id: "p11",
    slug: "warehouse-spintex-road",
    title: "Warehouse, Spintex Road",
    description: "1,200 sqm warehouse with loading bay and office annex.",
    price: 6000,
    listingType: "RENT",
    category: "commercial",
    city: "Accra",
    region: "Greater Accra",
    address: "Spintex Road, near Sakumono Junction",
    status: "ACTIVE",
    media: [],
    amenities: AMENITY_POOLS.commercial,
    developer: DEVELOPERS.goldcrest,
  },
  {
    id: "p12",
    slug: "office-building-ridge",
    title: "Office Building, Ridge",
    description: "4-storey office building, fully let with elevator access.",
    price: 750000,
    listingType: "SALE",
    category: "office",
    city: "Accra",
    region: "Greater Accra",
    address: "27 Ridge Road, Accra",
    status: "ACTIVE",
    media: [],
    amenities: AMENITY_POOLS.office,
    developer: DEVELOPERS.westgate,
  },
  {
    id: "p13",
    slug: "studio-apartment-anaji-takoradi",
    title: "Studio Apartment, Anaji",
    description: "Furnished studio suited to short or long-term stays.",
    price: 1800,
    listingType: "RENT",
    category: "apartment",
    city: "Takoradi",
    region: "Western",
    address: "3 Anaji Estate Road, Takoradi",
    status: "ACTIVE",
    media: [],
    amenities: AMENITY_POOLS.apartment,
    developer: DEVELOPERS.atlantic,
  },
  {
    id: "p14",
    slug: "4br-house-community-25-tema",
    title: "4BR House, Community 25",
    description: "Detached family home with a large compound.",
    price: 410000,
    listingType: "SALE",
    category: "house",
    city: "Tema",
    region: "Greater Accra",
    address: "Community 25, House 14B, Tema",
    status: "ACTIVE",
    media: [],
    amenities: AMENITY_POOLS.house,
    developer: DEVELOPERS.goldcrest,
  },
  {
    id: "p15",
    slug: "coastal-land-butumagyebu-takoradi",
    title: "Coastal Land, Butumagyebu",
    description: "Sea-view plot, ideal for a resort or private residence.",
    price: 95000,
    listingType: "SALE",
    category: "land",
    city: "Takoradi",
    region: "Western",
    address: "Butumagyebu Coastal Road, Takoradi",
    status: "ACTIVE",
    media: [],
    amenities: AMENITY_POOLS.land,
    developer: DEVELOPERS.westgate,
  },
  {
    id: "p16",
    slug: "2br-apartment-asokwa-kumasi",
    title: "2BR Apartment, Asokwa",
    description: "Gated community apartment with 24-hour security.",
    price: 340000,
    listingType: "SALE",
    category: "apartment",
    city: "Kumasi",
    region: "Ashanti",
    address: "8 Asokwa Estate Road, Kumasi",
    status: "ACTIVE",
    media: [],
    amenities: AMENITY_POOLS.apartment,
    developer: DEVELOPERS.atlantic,
  },
  {
    id: "p17",
    slug: "office-suite-community-1-tema",
    title: "Office Suite, Community 1",
    description: "Open-plan office suite near the Tema motorway roundabout.",
    price: 4200,
    listingType: "RENT",
    category: "office",
    city: "Tema",
    region: "Greater Accra",
    address: "Community 1, Tema Motorway Roundabout",
    status: "ACTIVE",
    media: [],
    amenities: AMENITY_POOLS.office,
    developer: DEVELOPERS.goldcrest,
  },
  {
    id: "p18",
    slug: "retail-block-adum-kumasi",
    title: "Retail Block, Adum",
    description: "Ground-floor retail units in Kumasi's central business area.",
    price: 680000,
    listingType: "SALE",
    category: "commercial",
    city: "Kumasi",
    region: "Ashanti",
    address: "Adum Central, Kumasi",
    status: "ACTIVE",
    media: [],
    amenities: AMENITY_POOLS.commercial,
    developer: DEVELOPERS.westgate,
  },
];

export interface GetPropertiesParams {
  page?: number;
  pageSize?: number;
}

export interface WhatsAppLinkResponse {
  deeplink: string;
}

function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  };
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(value), MOCK_LATENCY_MS),
  );
}

export const propertyService = {
  getProperties: ({
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  }: GetPropertiesParams = {}): Promise<PaginatedResult<Property>> =>
    delay(paginate(MOCK_PROPERTIES, page, pageSize)),

  getPropertyBySlug: (slug: string): Promise<PropertyDetail> => {
    const property = MOCK_PROPERTIES.find((item) => item.slug === slug);
    return property
      ? delay(property)
      : Promise.reject(new Error("Property not found"));
  },

  getRelatedProperties: (
    property: Pick<Property, "id" | "category">,
    limit = 4,
  ): Promise<Property[]> =>
    delay(
      MOCK_PROPERTIES.filter(
        (item) =>
          item.category === property.category && item.id !== property.id,
      ).slice(0, limit),
    ),

  /**
   * Simulates GET /api/v1/properties/:id/whatsapp-link. The developer's number is never sent
   * to the client before this call (docs/ARCHITECTURE.md §8's number-masking design) — since
   * no real number exists yet, the mock omits it entirely rather than fabricating one.
   */
  getWhatsAppLink: (property: {
    title: string;
    city: string;
    listingType: Property["listingType"];
  }): Promise<WhatsAppLinkResponse> =>
    delay({
      deeplink: `https://wa.me/?text=${encodeURIComponent(buildWhatsAppMessage(property))}`,
    }),
};
