import type { PropertyCategory } from "@/constants/categories";

export type UserRole = "USER" | "DEVELOPER" | "ADMIN";

export interface User {
  id: string;
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

export interface DeveloperSummary {
  id: string;
  slug: string;
  name: string;
  isVerified: boolean;
  rating?: number;
}

/**
 * The full detail-page shape. Kept separate from Property (the list/card shape) because a real
 * API would join the developer and other heavier fields only on GET /properties/:slug, not on
 * the list endpoint — mirrors that distinction instead of forcing every card fetch to carry it.
 */
export interface PropertyDetail extends Property {
  address: string;
  amenities: string[];
  developer: DeveloperSummary;
}
