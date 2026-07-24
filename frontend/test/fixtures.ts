import type {
  Appointment,
  Developer,
  DeveloperProfile,
  Property,
  PropertyDetail,
} from "@/types";

export function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: "p1",
    slug: "test-property",
    title: "Test Property",
    description: "A lovely test property.",
    price: 100000,
    listingType: "SALE",
    category: "apartment",
    city: "Accra",
    region: "Greater Accra",
    status: "ACTIVE",
    media: [],
    ...overrides,
  };
}

export function makeDeveloper(overrides: Partial<Developer> = {}): Developer {
  return {
    id: "d1",
    slug: "test-developer",
    name: "Test Developer",
    city: "Accra",
    region: "Greater Accra",
    isVerified: true,
    rating: 4.5,
    activeListings: 3,
    ...overrides,
  };
}

export function makePropertyDetail(
  overrides: Partial<PropertyDetail> = {},
): PropertyDetail {
  return {
    ...makeProperty(),
    address: "1 Test Street",
    amenities: ["Parking", "24/7 Security"],
    developer: makeDeveloper(),
    ...overrides,
  };
}

export function makeAppointment(
  overrides: Partial<Appointment> = {},
): Appointment {
  return {
    id: "ap1",
    propertyId: "p1",
    propertyTitle: "Test Property",
    clientName: "Test Client",
    scheduledFor: "2026-07-25T10:00:00.000Z",
    status: "REQUESTED",
    ...overrides,
  };
}

export function makeDeveloperProfile(
  overrides: Partial<DeveloperProfile> = {},
): DeveloperProfile {
  return {
    ...makeDeveloper(),
    bio: "A great developer building homes across the region.",
    email: "test@example.com",
    socialLinks: {},
    totalListings: 5,
    yearsActive: 3,
    ...overrides,
  };
}
