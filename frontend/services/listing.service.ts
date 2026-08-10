import type { PropertyCategory } from "@/constants/categories";
import type {
  ListingType,
  PaginatedResult,
  Property,
  PropertyStatus,
} from "@/types";

import { MOCK_LISTINGS } from "./mocks/listings.mock";

const DEFAULT_PAGE_SIZE = 10;
const MOCK_LATENCY_MS = 400;

export type ListingSort =
  "updated_desc" | "price_asc" | "price_desc" | "title_asc";

export interface ListingFilters {
  q?: string;
  status?: PropertyStatus;
  category?: PropertyCategory;
  listingType?: ListingType;
  sort?: ListingSort;
}

export interface GetListingsParams extends ListingFilters {
  page?: number;
  pageSize?: number;
}

export type ListingStatusCounts = Record<PropertyStatus, number>;

/** One allowed forward move from a given status, with the verb a developer sees in the UI. */
export interface StatusTransition {
  target: PropertyStatus;
  label: string;
}

/**
 * The portfolio's status lifecycle. Deliberately not a full graph — SOLD is
 * terminal (no real listing un-sells itself) and DRAFT can only move forward to
 * ACTIVE (publish). Both the single-row action menu and the bulk actions toolbar
 * read from this one map, so a rule change here can't drift between the two UIs.
 */
export const STATUS_TRANSITIONS: Record<PropertyStatus, StatusTransition[]> = {
  DRAFT: [{ target: "ACTIVE", label: "Publish" }],
  ACTIVE: [
    { target: "RESERVED", label: "Mark as Reserved" },
    { target: "SOLD", label: "Mark as Sold" },
    { target: "SUSPENDED", label: "Suspend" },
  ],
  RESERVED: [
    { target: "ACTIVE", label: "Reopen" },
    { target: "SOLD", label: "Mark as Sold" },
  ],
  SUSPENDED: [{ target: "ACTIVE", label: "Reactivate" }],
  SOLD: [],
};

/**
 * Only listings with no real transaction history are hard-deletable: never-published
 * drafts, or listings already taken down. Active/reserved/sold listings must be
 * suspended first — mirrors how a real backend would guard against deleting a
 * listing with live enquiries or a completed sale.
 */
export const DELETABLE_STATUSES: ReadonlySet<PropertyStatus> = new Set([
  "DRAFT",
  "SUSPENDED",
]);

export function canDeleteListing(status: PropertyStatus): boolean {
  return DELETABLE_STATUSES.has(status);
}

export function getAvailableTransitions(
  status: PropertyStatus,
): StatusTransition[] {
  return STATUS_TRANSITIONS[status];
}

function isValidTransition(from: PropertyStatus, to: PropertyStatus): boolean {
  return STATUS_TRANSITIONS[from].some((t) => t.target === to);
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

function filterListings(
  items: Property[],
  filters: ListingFilters,
): Property[] {
  return items.filter((item) => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (filters.listingType && item.listingType !== filters.listingType)
      return false;

    if (filters.q) {
      const haystack = `${item.title} ${item.city}`.toLowerCase();
      if (!haystack.includes(filters.q.toLowerCase())) return false;
    }

    return true;
  });
}

function sortListings(
  items: Property[],
  sort: ListingSort = "updated_desc",
): Property[] {
  const byUpdatedDesc = (a: Property, b: Property) =>
    new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();

  if (sort === "price_asc") return [...items].sort((a, b) => a.price - b.price);
  if (sort === "price_desc")
    return [...items].sort((a, b) => b.price - a.price);
  if (sort === "title_asc")
    return [...items].sort((a, b) => a.title.localeCompare(b.title));
  return [...items].sort(byUpdatedDesc);
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(value), MOCK_LATENCY_MS),
  );
}

function findListingOrThrow(id: string): Property {
  const listing = MOCK_LISTINGS.find((item) => item.id === id);
  if (!listing) throw new Error("Listing not found");
  return listing;
}

/** The subset of Property fields the editor can write — id/slug/status/updatedAt are server-managed. */
export type ListingPatch = Partial<
  Pick<
    Property,
    | "title"
    | "description"
    | "price"
    | "listingType"
    | "category"
    | "city"
    | "district"
    | "region"
    | "address"
    | "amenities"
    | "bedrooms"
    | "bathrooms"
    | "carSpaces"
    | "yearBuilt"
    | "landSizeSqm"
    | "buildingSizeSqm"
    | "media"
  >
>;

function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "untitled-listing";
}

/** Appends a numeric suffix until the slug is unique — a draft can start untitled, so collisions on "untitled-listing" are the common case, not the edge case. */
function uniqueSlug(base: string): string {
  let candidate = base;
  let suffix = 1;
  while (MOCK_LISTINGS.some((item) => item.slug === candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

/**
 * The developer's own portfolio — filtering, sorting, pagination, and the status/
 * delete mutations "My Properties" needs. Distinct from propertyService (the public,
 * read-only catalogue every visitor browses): this is the authenticated owner's
 * management surface, and mutates its mock store in place.
 * TODO(backend): replace every method with GET/PATCH/DELETE
 * /api/v1/developers/me/listings once it exists.
 */
export const listingService = {
  getListings: ({
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    ...filters
  }: GetListingsParams = {}): Promise<PaginatedResult<Property>> => {
    const results = sortListings(
      filterListings(MOCK_LISTINGS, filters),
      filters.sort,
    );
    return delay(paginate(results, page, pageSize));
  },

  getStatusCounts: (): Promise<ListingStatusCounts> => {
    const counts: ListingStatusCounts = {
      ACTIVE: 0,
      RESERVED: 0,
      SOLD: 0,
      DRAFT: 0,
      SUSPENDED: 0,
    };
    for (const item of MOCK_LISTINGS) counts[item.status] += 1;
    return delay(counts);
  },

  /**
   * `async` (not a plain arrow returning a Promise) so that
   * `findListingOrThrow`'s synchronous throw on an unknown id becomes a
   * proper rejected promise instead of an exception thrown at call time —
   * the same bug class fixed in `notification.service.ts`'s `markAsRead` and
   * `appointment.service.ts`'s `updateStatus`/`reschedule` (see ADR-015).
   */
  updateListingStatus: async (
    id: string,
    status: PropertyStatus,
  ): Promise<Property> => {
    const listing = findListingOrThrow(id);
    if (!isValidTransition(listing.status, status)) {
      return Promise.reject(
        new Error(`Cannot move a listing from ${listing.status} to ${status}.`),
      );
    }
    listing.status = status;
    listing.updatedAt = new Date().toISOString();
    return delay(listing);
  },

  /** `async` for the same reason as `updateListingStatus`. */
  deleteListing: async (id: string): Promise<void> => {
    const listing = findListingOrThrow(id);
    if (!canDeleteListing(listing.status)) {
      return Promise.reject(
        new Error(
          `A ${listing.status.toLowerCase()} listing can't be deleted directly — suspend it first.`,
        ),
      );
    }
    const index = MOCK_LISTINGS.findIndex((item) => item.id === id);
    MOCK_LISTINGS.splice(index, 1);
    return delay(undefined);
  },

  /**
   * Applies to whichever selected listings the transition is actually valid for and
   * silently skips the rest — a bulk action over a mixed-status selection (e.g.
   * "Publish" applied to a selection of drafts and actives) shouldn't fail outright
   * just because some rows don't qualify.
   */
  bulkUpdateStatus: (
    ids: string[],
    status: PropertyStatus,
  ): Promise<{ updated: string[]; skipped: string[] }> => {
    const updated: string[] = [];
    const skipped: string[] = [];
    const now = new Date().toISOString();

    for (const id of ids) {
      const listing = MOCK_LISTINGS.find((item) => item.id === id);
      if (listing && isValidTransition(listing.status, status)) {
        listing.status = status;
        listing.updatedAt = now;
        updated.push(id);
      } else {
        skipped.push(id);
      }
    }

    return delay({ updated, skipped });
  },

  bulkDelete: (
    ids: string[],
  ): Promise<{ deleted: string[]; skipped: string[] }> => {
    const deleted: string[] = [];
    const skipped: string[] = [];

    for (const id of ids) {
      const listing = MOCK_LISTINGS.find((item) => item.id === id);
      if (listing && canDeleteListing(listing.status)) {
        deleted.push(id);
      } else {
        skipped.push(id);
      }
    }

    for (const id of deleted) {
      const index = MOCK_LISTINGS.findIndex((item) => item.id === id);
      if (index !== -1) MOCK_LISTINGS.splice(index, 1);
    }

    return delay({ deleted, skipped });
  },

  /** The developer's own full editable record — includes address/amenities the list view doesn't need. */
  getListingForEdit: (slug: string): Promise<Property> => {
    const listing = MOCK_LISTINGS.find((item) => item.slug === slug);
    return listing
      ? delay(listing)
      : Promise.reject(new Error("Listing not found"));
  },

  /**
   * Creates a new listing as a DRAFT with a stable, immutable slug (never
   * regenerated on later title edits, so the editor's own URL can't go stale
   * mid-session). Untitled/incomplete fields get empty-but-typed defaults
   * (0, "", []) rather than leaving them undefined — Property's non-optional
   * fields stay non-optional for every other reader (cards, tables); it's
   * `publishListingSchema` (lib/validation/listing.ts), not this shape, that
   * enforces "must be filled in before going live."
   */
  createListing: (patch: ListingPatch = {}): Promise<Property> => {
    const title = patch.title?.trim() || "Untitled Listing";
    const slug = uniqueSlug(slugify(title));
    const now = new Date().toISOString();

    const listing: Property = {
      id: crypto.randomUUID(),
      slug,
      title,
      description: patch.description ?? "",
      price: patch.price ?? 0,
      listingType: patch.listingType ?? "SALE",
      category: patch.category ?? "apartment",
      city: patch.city ?? "",
      district: patch.district,
      region: patch.region ?? "",
      status: "DRAFT",
      media: patch.media ?? [],
      address: patch.address ?? "",
      amenities: patch.amenities ?? [],
      bedrooms: patch.bedrooms,
      bathrooms: patch.bathrooms,
      carSpaces: patch.carSpaces,
      yearBuilt: patch.yearBuilt,
      landSizeSqm: patch.landSizeSqm,
      buildingSizeSqm: patch.buildingSizeSqm,
      updatedAt: now,
    };

    MOCK_LISTINGS.unshift(listing);
    return delay(listing);
  },

  /**
   * PATCH semantics: only the keys present in `patch` are written. Autosave
   * sends just the fields that changed since the last save; an explicit "Save
   * changes" click sends the full form values as one patch — same method,
   * same contract either way.
   */
  updateListing: (slug: string, patch: ListingPatch): Promise<Property> => {
    const listing = MOCK_LISTINGS.find((item) => item.slug === slug);
    if (!listing) {
      return Promise.reject(new Error("Listing not found"));
    }

    Object.assign(listing, patch, { updatedAt: new Date().toISOString() });
    return delay(listing);
  },
};
