import type { PropertyCategory } from "@/constants/categories";

export type UserRole = "USER" | "DEVELOPER" | "ADMIN";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  developerId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ListingType = "SALE" | "RENT";

export type PropertyStatus =
  "ACTIVE" | "RESERVED" | "SOLD" | "DRAFT" | "SUSPENDED";

export interface PropertyMedia {
  url: string;
  publicId: string;
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  listingType: ListingType;
  category: PropertyCategory;
  city: string;
  region: string;
  status: PropertyStatus;
  media: PropertyMedia[];
}

/** The list/card shape — also what a property embeds for its developer. */
export interface Developer {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  city: string;
  region: string;
  isVerified: boolean;
  rating?: number;
  activeListings: number;
}

export interface DeveloperSocialLinks {
  website?: string;
  facebook?: string;
  instagram?: string;
}

/**
 * The full profile-page shape. Kept separate from Developer (the list/card + property-embed
 * shape) for the same reason as Property/PropertyDetail: a real API would only join bio, cover
 * image, and stats on GET /developers/:slug, not the list endpoint or a property's join.
 */
export interface DeveloperProfile extends Developer {
  bio: string;
  coverImageUrl?: string;
  email: string;
  socialLinks: DeveloperSocialLinks;
  totalListings: number;
  yearsActive: number;
}

/**
 * The full detail-page shape. Kept separate from Property (the list/card shape) because a real
 * API would join the developer and other heavier fields only on GET /properties/:slug, not on
 * the list endpoint — mirrors that distinction instead of forcing every card fetch to carry it.
 */
export interface PropertyDetail extends Property {
  address: string;
  amenities: string[];
  developer: Developer;
}
