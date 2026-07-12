import type { DeveloperProfile } from "@/types";

// TODO(backend): replace with GET /api/v1/developers once the endpoint exists.
// Canonical mock developer records — properties.mock.ts references these by object identity
// (via DEVELOPERS.<key>) so a property's embedded `developer` field and a developer's own
// profile page are always the same data, never two copies that can drift apart.
export const DEVELOPERS = {
  atlantic: {
    id: "d1",
    slug: "atlantic-properties",
    name: "Atlantic Properties",
    city: "Accra",
    region: "Greater Accra",
    isVerified: true,
    rating: 4.6,
    activeListings: 6,
    bio: "Atlantic Properties has been building and selling residential and commercial real estate across Greater Accra since 2019, with a focus on gated communities and serviced apartments.",
    email: "hello@atlanticproperties.example",
    socialLinks: {
      website: "https://atlanticproperties.example",
      facebook: "https://facebook.com/atlanticproperties",
      instagram: "https://instagram.com/atlanticproperties",
    },
    totalListings: 9,
    yearsActive: 6,
  },
  goldcrest: {
    id: "d2",
    slug: "goldcrest-homes",
    name: "Goldcrest Homes",
    city: "Accra",
    region: "Greater Accra",
    isVerified: true,
    rating: 4.2,
    activeListings: 6,
    bio: "Goldcrest Homes develops family housing and light-industrial space in Accra, Tema, and Kumasi, with an emphasis on affordable rent-to-own schemes.",
    email: "contact@goldcresthomes.example",
    socialLinks: {
      website: "https://goldcresthomes.example",
      facebook: "https://facebook.com/goldcresthomes",
    },
    totalListings: 8,
    yearsActive: 4,
  },
  westgate: {
    id: "d3",
    slug: "westgate-developers",
    name: "Westgate Developers",
    city: "Kumasi",
    region: "Ashanti",
    isVerified: false,
    rating: 3.8,
    activeListings: 6,
    bio: "Westgate Developers is a newer entrant building land, commercial, and office space across Ashanti and the Western Region.",
    email: "info@westgatedevelopers.example",
    socialLinks: {
      instagram: "https://instagram.com/westgatedevelopers",
    },
    totalListings: 7,
    yearsActive: 2,
  },
} satisfies Record<string, DeveloperProfile>;

export const MOCK_DEVELOPERS: DeveloperProfile[] = Object.values(DEVELOPERS);
