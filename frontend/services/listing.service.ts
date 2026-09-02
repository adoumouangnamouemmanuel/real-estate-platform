import { api } from "@/lib/api";
import type { PropertyCategory } from "@/constants/categories";
import type {
  ListingType,
  PaginatedResult,
  Property,
  PropertyStatus,
  ApiResponse,
} from "@/types";

const DEFAULT_PAGE_SIZE = 10;

export type ListingSort =
  | "updated_desc"
  | "price_asc"
  | "price_desc"
  | "title_asc";

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

/**
 * Statuses that have a page on the public catalogue. Straight from
 * `docs/API_CONTRACT.md` §3.
 */
export const PUBLICLY_VISIBLE_STATUSES: ReadonlySet<PropertyStatus> = new Set([
  "ACTIVE",
]);

export function isPubliclyVisible(status: PropertyStatus): boolean {
  return PUBLICLY_VISIBLE_STATUSES.has(status);
}

export function getAvailableTransitions(
  status: PropertyStatus,
): StatusTransition[] {
  return STATUS_TRANSITIONS[status];
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

export const listingService = {
  getListings: ({
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    ...filters
  }: GetListingsParams = {}): Promise<PaginatedResult<Property>> => {
    const params: Record<string, string | number> = { page, pageSize };
    if (filters.q) params.q = filters.q;
    if (filters.status) params.status = filters.status;
    if (filters.category) params.category = filters.category;
    if (filters.listingType) params.listingType = filters.listingType;
    if (filters.sort) params.sort = filters.sort;

    return api
      .get<ApiResponse<PaginatedResult<Property>>>(
        "/developers/me/listings",
        { params },
      )
      .then((res) => res.data.data);
  },

  getStatusCounts: (): Promise<ListingStatusCounts> =>
    api
      .get<ApiResponse<ListingStatusCounts>>("/developers/me/listings/counts")
      .then((res) => res.data.data),

  updateListingStatus: async (
    id: string,
    status: PropertyStatus,
  ): Promise<Property> => {
    const res = await api.patch<ApiResponse<Property>>(
      `/developers/me/listings/${id}/status`,
      { status },
    );
    return res.data.data;
  },

  deleteListing: async (id: string): Promise<void> => {
    await api.delete(`/developers/me/listings/${id}`);
  },

  bulkUpdateStatus: (
    ids: string[],
    status: PropertyStatus,
  ): Promise<{ updated: string[]; skipped: string[] }> =>
    api
      .patch<ApiResponse<{ updated: string[]; skipped: string[] }>>(
        "/developers/me/listings/bulk-status",
        { ids, status },
      )
      .then((res) => res.data.data),

  bulkDelete: (
    ids: string[],
  ): Promise<{ deleted: string[]; skipped: string[] }> =>
    api
      .post<ApiResponse<{ deleted: string[]; skipped: string[] }>>(
        "/developers/me/listings/bulk-delete",
        { ids },
      )
      .then((res) => res.data.data),

  getListingForEdit: (id: string): Promise<Property> =>
    api
      .get<ApiResponse<Property>>(`/developers/me/listings/${id}`)
      .then((res) => res.data.data),

  createListing: (patch: ListingPatch = {}): Promise<Property> =>
    api
      .post<ApiResponse<Property>>("/developers/me/listings", patch)
      .then((res) => res.data.data),

  updateListing: (id: string, patch: ListingPatch): Promise<Property> =>
    api
      .patch<ApiResponse<Property>>(`/developers/me/listings/${id}`, patch)
      .then((res) => res.data.data),
};
