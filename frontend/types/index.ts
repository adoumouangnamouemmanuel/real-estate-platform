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
  /**
   * Explicit display order (0 = cover image), set by the editor's drag-to-reorder
   * UI. Persisted rather than inferred from array position: an async upload
   * queue can append items out of visual order, and relying on array index alone
   * would make "what the user sees" and "what gets saved" driftable.
   */
  order: number;
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
  /**
   * ISO 8601 last-updated timestamp. Optional because the public catalogue's
   * list endpoint doesn't surface it; the developer's own dashboard listings do,
   * which is what the Recent Listings widget orders by and displays.
   */
  updatedAt?: string;
  /**
   * Optional for the same reason as `updatedAt`: the public list endpoint
   * doesn't surface them, but the Property Editor (Phase 6.3) reads and writes
   * both on the developer's own listing record.
   */
  address?: string;
  amenities?: string[];
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

// --- Developer Dashboard (Phase 6.1) -----------------------------------------
// These model the developer-facing dashboard's own data. Each maps to a future
// backend endpoint the mock dashboard service stands in for (see
// services/dashboard.service.ts) — backend integration replaces the service, not
// these shapes or the components that consume them.

export type AppointmentStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "RESCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

/** A property viewing a prospective buyer/renter has requested or booked. */
export interface Appointment {
  id: string;
  propertyId: string;
  propertyTitle: string;
  clientName: string;
  /** ISO 8601 timestamp of the visit. */
  scheduledFor: string;
  status: AppointmentStatus;
  /**
   * ISO 8601 timestamp this appointment was rescheduled *from* — only set
   * while `status === "RESCHEDULED"`. Optional and additive for the same
   * reason `Property.updatedAt` is: the Dashboard Home widget's shape
   * (Phase 6.1) doesn't need it, the Appointments page (Phase 6.4) does.
   */
  previousScheduledFor?: string;
  /** The appointment's own lifecycle, rendered via the reusable ActivityTimeline in its details drawer. */
  history?: ActivityItem[];
}

/** The three buckets the Appointment Overview widget renders as tabs. */
export interface AppointmentOverview {
  upcoming: Appointment[];
  requested: Appointment[];
  completed: Appointment[];
}

/**
 * Granular per-event types — every future type is additive here, same as
 * AppointmentStatus/ActivityType (see ADR-014, ADR-015). Deliberately no
 * "MESSAGE"/enquiry type: ADR-006 rules out in-app messaging entirely
 * (WhatsApp-first), so nothing in this app ever produces one.
 */
export type NotificationType =
  | "APPOINTMENT_REQUESTED"
  | "APPOINTMENT_CONFIRMED"
  | "APPOINTMENT_CANCELLED"
  | "APPOINTMENT_RESCHEDULED"
  | "APPOINTMENT_COMPLETED"
  | "APPOINTMENT_NO_SHOW"
  | "LISTING_PUBLISHED"
  | "LISTING_SUSPENDED"
  | "DRAFT_REMINDER"
  | "SYSTEM";

/**
 * A strict progression, not two independent flags — see ADR-015. ARCHIVED is
 * designed in now (so filtering/counting logic never has to change shape
 * later) but nothing produces or exposes it yet: no archive action, no
 * archive tab.
 */
export type NotificationStatus = "UNREAD" | "READ" | "ARCHIVED";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
  status: NotificationStatus;
  /** Optional deep link (e.g. back to the triggering appointment or listing). */
  link?: string;
}

export type ActivityType =
  | "LISTING_PUBLISHED"
  | "LISTING_UPDATED"
  | "APPOINTMENT_REQUESTED"
  | "APPOINTMENT_CONFIRMED"
  | "APPOINTMENT_RESCHEDULED"
  | "APPOINTMENT_COMPLETED"
  | "APPOINTMENT_CANCELLED"
  | "APPOINTMENT_NO_SHOW"
  | "PROPERTY_VIEWED"
  | "PROFILE_UPDATED";

/** One event on the Activity Timeline. */
export interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
}

/** The six headline KPIs on the dashboard home. */
export interface DashboardMetrics {
  totalProperties: number;
  activeListings: number;
  draftListings: number;
  appointmentRequests: number;
  unreadNotifications: number;
  totalPropertyViews: number;
}

/** Identity/brand shown in the welcome header — distinct from the numeric metrics. */
export interface DashboardSummary {
  developerName: string;
  companyName: string;
}
