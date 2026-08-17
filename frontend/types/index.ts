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
  /**
   * A finer-grained subdivision within `city` (see `constants/locations.ts`'s
   * `DISTRICTS`), mirroring the backend ER's `district`/`district_id`.
   * Deliberately additive alongside `region`, not a replacement for it —
   * `region` and `district` are not the same concept (region is
   * Ghana-region-scale, district is a city-scoped subdivision) and the final
   * terminology is still an open product/backend decision — see
   * docs/PRODUCT_BACKEND_RECONCILIATION.md §6/§18. Optional because existing
   * mock properties predate this field.
   */
  district?: string;
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
  /**
   * Undefined for property types the field doesn't apply to (land, most
   * commercial/office listings) rather than 0 — a studio has 0 bedrooms and a
   * warehouse has none at all, and a card/detail page needs to tell those
   * apart to decide whether to render the stat at all.
   */
  bedrooms?: number;
  bathrooms?: number;
  /** Undefined where the category doesn't have parking (e.g. most land listings). */
  carSpaces?: number;
  /** Undefined where the category doesn't have a meaningful construction date (land). */
  yearBuilt?: number;
  /**
   * @deprecated Kept for backward compatibility with existing mock records
   * only — a single generic area figure can't losslessly represent both a
   * land parcel and a building's footprint (the ER's `property` table has
   * two distinct columns: `land_size_sq_m` and `building_size_sq_m`). New
   * code should read `landSizeSqm`/`buildingSizeSqm` instead; this field is
   * only still read as a display fallback where a category-appropriate value
   * isn't set on an older record.
   */
  areaSqm?: number;
  /** Land parcel size in square meters — the primary measurement for LAND listings, optionally recorded for others. */
  landSizeSqm?: number;
  /** Built floor area in square meters — the primary measurement for House/Apartment/Commercial/Office listings. */
  buildingSizeSqm?: number;
  /**
   * A mock popularity signal (see services/favorite.service.ts) — aggregate
   * count of everyone who has favorited this listing, distinct from whether
   * *this* browser has. Sourced from `services/mocks/properties.mock.ts`
   * today; a real backend would expose this as a computed column
   * (`COUNT(*) FROM property_favorites`), never a value the frontend writes.
   */
  favoriteCount?: number;
}

/**
 * A single selectable property feature/amenity — mirrors the backend ER's
 * `feature` table (`feature_name`, `category`, `icon_name`). Replaces the old
 * `AMENITY_POOLS` hardcoded string map as the one source of truth the
 * Property Editor, Property Detail, and (in future) Property Cards/Filters
 * all read through — see services/feature.service.ts.
 */
export interface Feature {
  id: string;
  name: string;
  /** A broad display grouping (Security, Utilities, Outdoor, Land, ...) — mirrors `feature.category`. */
  category: string;
  /** A lucide-react icon name — mirrors `feature.icon_name`. */
  iconName: string;
  /**
   * Which property categories this feature is offered for. Frontend-owned
   * eligibility, not a backend concept: the ER's `property_feature` join has
   * no category constraint of its own — this is the same product decision
   * `AMENITY_POOLS` encoded before, just backed by a real catalog now.
   */
  propertyCategories: PropertyCategory[];
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
  /**
   * Short description, shown as the Developer directory card's editorial line.
   *
   * The data already exists on both sides: every record in
   * `services/mocks/developers.mock.ts` carries a bio (the mock array is typed
   * `DeveloperProfile[]` and `developer.service.ts` returns it unmapped, so the
   * list path has always carried this value at runtime), and the backend model
   * has a real `property_developer.bio` column. Nothing here is invented.
   *
   * Optional rather than required because `docs/API_CONTRACT.md` §Developers
   * currently defines `bio` as **detail-only** — it lists `bio`,
   * `socialLinks`, `totalListings` and `yearsActive` as fields that "only need
   * joining on the detail page", unlike the cheap `activeListings`/`rating`
   * aggregates. The directory renders a bio when one is present and degrades
   * cleanly when it isn't, so a list response that omits it stays correct.
   *
   * TODO(backend): serving `bio` on the developer *list* DTO is therefore a
   * **proposed contract addendum, not agreed behaviour** — it would widen
   * `GET /api/v1/developers` beyond what API_CONTRACT.md currently specifies,
   * and needs backend agreement before either document changes. Same handling
   * as the proposed public `listingType` filter (see CHANGELOG.md, Stage 6):
   * documented as a proposal, not applied.
   */
  bio?: string;
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

/** The headline KPIs on the dashboard home. */
export interface DashboardMetrics {
  totalProperties: number;
  activeListings: number;
  draftListings: number;
  appointmentRequests: number;
  unreadNotifications: number;
  /**
   * Optional, and deliberately not supplied by the mock service today. There is
   * no per-view data anywhere in the frontend — this was a hardcoded constant
   * (`3742`), which is exactly the claim Analytics already refuses to make
   * (ADR-016 excludes every view-based metric for the same reason). Kept in the
   * shape because `docs/API_CONTRACT.md` §12 documents the field and flags it as
   * a known placeholder needing a real source; `property.view_count` +
   * `property_analytics` now exist backend-side (see
   * docs/PRODUCT_BACKEND_RECONCILIATION.md §1), so this becomes real at
   * integration. Until a real value arrives, omit it — never substitute one.
   */
  totalPropertyViews?: number;
}

/** Identity/brand shown in the welcome header — distinct from the numeric metrics. */
export interface DashboardSummary {
  developerName: string;
  companyName: string;
}

// --- Analytics (Phase 6.7) ----------------------------------------------------
// A dedicated domain model, deliberately separate from DashboardMetrics: these
// shapes are the *output* of pure calculation utilities (see
// lib/analyticsCalculations.ts) over existing Property/Appointment data, not a
// new backend entity of their own. See ADR-016 for the frontend/backend
// aggregation split this model is designed around.

export type AnalyticsPeriod = "7d" | "30d" | "90d";

/**
 * One stage of the appointment lifecycle funnel, in display order. Label-free
 * on purpose: `AppointmentStatusBadge`'s `APPOINTMENT_STATUS_LABEL`
 * (`components/dashboard/StatusBadge.tsx`) is already the one canonical
 * status→label map every other surface reads from — this shape stays pure
 * numbers so nothing in `lib/analyticsCalculations.ts` needs to duplicate it.
 */
export interface AppointmentFunnelStage {
  status: AppointmentStatus;
  count: number;
}

/**
 * The appointment lifecycle read as a conversion funnel rather than a status
 * filter — the same six-state graph ADR-014 already established, aggregated
 * over a period instead of browsed one row at a time.
 */
export interface AppointmentFunnel {
  period: AnalyticsPeriod;
  stages: AppointmentFunnelStage[];
  totalRequested: number;
  /** (Confirmed + Cancelled + Completed + No Show) / Requested — how much of the funnel a developer has actually acted on. */
  responseRate: number;
  /** Completed / (Confirmed + Completed + No Show) — of visits that happened or were supposed to, how many completed. */
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  /** Average hours between a request and its confirmation, for appointments confirmed within the period. Null when no appointment in the period has both timestamps. */
  averageResponseHours: number | null;
}

/** Label-free for the same reason as `AppointmentFunnelStage` — `PROPERTY_STATUS_LABEL` in `StatusBadge.tsx` is the one canonical map. */
export interface PortfolioStatusBreakdown {
  status: PropertyStatus;
  count: number;
}

/** Label-free — `PROPERTY_CATEGORIES` in `constants/categories.ts` is the one canonical map. */
export interface PortfolioCategoryBreakdown {
  category: PropertyCategory;
  count: number;
}

/** Portfolio composition is always current-state — not period-filtered, since "what do I have right now" doesn't have a date range. */
export interface PortfolioComposition {
  totalListings: number;
  byStatus: PortfolioStatusBreakdown[];
  byCategory: PortfolioCategoryBreakdown[];
}

/**
 * Additive across every domain that surfaces "what needs attention" — see
 * ADR-016 (Analytics) and the Dashboard Home transformation. The first three
 * values originated in Analytics; the last two are Dashboard Home's own
 * (new appointment requests, suspended listings), computed from Dashboard
 * Home's independent dataset (see lib/dashboardActionNeeded.ts) rather than
 * Analytics'/Appointments' own copies.
 */
export type ActionNeededType =
  | "OVERDUE_APPOINTMENTS"
  | "STALE_DRAFTS"
  | "HIGH_CANCELLATION_RATE"
  | "NEW_APPOINTMENT_REQUESTS"
  | "SUSPENDED_LISTINGS";

export type ActionNeededSeverity = "high" | "medium";

/**
 * "What should I act on today" — always current-state, like
 * PortfolioComposition, never period-filtered. A first-class feature (see
 * ADR-016), not a decorative banner: every item deep-links straight into the
 * already-filtered view that resolves it.
 */
export interface ActionNeededItem {
  type: ActionNeededType;
  severity: ActionNeededSeverity;
  title: string;
  description: string;
  count: number;
  href: string;
}

/** One StatCard-shaped headline number, with an optional real (not fabricated) trend series. */
export interface AnalyticsStat {
  key: string;
  label: string;
  value: number;
  format: "number" | "percent" | "hours";
  hint?: string;
  /** Daily values, oldest first, one point per day in the period — only present where the underlying series is real (derived from timestamped history events), never interpolated to "look complete". */
  trend?: number[];
}

/** The full Analytics page payload for a given period — one fetch, one shape, mirroring AppointmentOverview's precedent of a single composed response for a whole page section. */
export interface AnalyticsSnapshot {
  period: AnalyticsPeriod;
  generatedAt: string;
  actionNeeded: ActionNeededItem[];
  stats: AnalyticsStat[];
  funnel: AppointmentFunnel;
  portfolio: PortfolioComposition;
}
