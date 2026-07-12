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
