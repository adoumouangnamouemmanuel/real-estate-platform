import { prisma } from "../../config/prisma.js";
import { NotFoundError, BadRequestError } from "../../utils/errors.js";
import { parsePagination, paginateResult } from "../../utils/pagination.js";
import type { PaginatedResult } from "../../utils/pagination.js";

type PropertyStatus = "DRAFT" | "ACTIVE" | "RESERVED" | "SOLD" | "SUSPENDED";

const VALID_TRANSITIONS: Record<PropertyStatus, PropertyStatus[]> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["RESERVED", "SOLD", "SUSPENDED"],
  RESERVED: ["ACTIVE", "SOLD"],
  SUSPENDED: ["ACTIVE"],
  SOLD: [],
};
const DELETABLE_STATUSES: PropertyStatus[] = ["DRAFT", "SUSPENDED"];

function isValidTransition(from: PropertyStatus, to: PropertyStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

function slugify(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "untitled-listing";
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base, suffix = 1;
  while (true) {
    const existing = await prisma.property.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
    suffix++;
    candidate = `${base}-${suffix}`;
  }
}

async function resolveCityId(cityName: string): Promise<string> {
  const city = await prisma.city.findFirst({ where: { name: { equals: cityName, mode: "insensitive" } }, select: { id: true } });
  if (!city) throw new BadRequestError("City not found");
  return city.id;
}

export interface GetListingsParams {
  q?: string; status?: string; category?: string; listingType?: string;
  sort?: string; page?: number; pageSize?: number;
}

export async function getListings(developerId: string, params: GetListingsParams = {}): Promise<PaginatedResult<any>> {
  const { skip, take, page, pageSize } = parsePagination(params);
  const where: any = { propertyDeveloperId: developerId, deletedAt: null };
  if (params.status) where.status = params.status;
  if (params.category) where.category = params.category;
  if (params.listingType) where.listingType = params.listingType;
  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { city: { contains: params.q, mode: "insensitive" } },
    ];
  }

  let orderBy: any = { updatedAt: "desc" };
  if (params.sort === "price_asc") orderBy = { price: "asc" };
  else if (params.sort === "price_desc") orderBy = { price: "desc" };
  else if (params.sort === "title_asc") orderBy = { title: "asc" };

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where, skip, take, orderBy,
      include: { media: { orderBy: { order: "asc" } }, cityRef: { select: { name: true } } },
    }),
    prisma.property.count({ where }),
  ]);
  return paginateResult(items.map(mapListing), total, page, pageSize);
}

export async function getStatusCounts(developerId: string) {
  const counts = await prisma.property.groupBy({
    by: ["status"],
    where: { propertyDeveloperId: developerId, deletedAt: null },
    _count: { status: true },
  });
  const result: Record<PropertyStatus, number> = { DRAFT: 0, ACTIVE: 0, RESERVED: 0, SOLD: 0, SUSPENDED: 0 };
  for (const c of counts) result[c.status as PropertyStatus] = c._count.status;
  return result;
}

export async function getListingForEdit(developerId: string, id: string) {
  const listing = await prisma.property.findFirst({
    where: { id, propertyDeveloperId: developerId, deletedAt: null },
    include: {
      media: { orderBy: { order: "asc" } },
      cityRef: { select: { name: true } },
      district: { select: { name: true } },
      features: { include: { feature: true } },
    },
  });
  if (!listing) throw new NotFoundError("Listing not found");
  return {
    ...mapListing(listing),
    address: listing.address,
    amenities: (listing.features ?? []).map((f: any) => f.feature.featureName),
    district: listing.district?.name ?? undefined,
    landSizeSqm: listing.landSizeSqM ? Number(listing.landSizeSqM) : undefined,
    buildingSizeSqm: listing.buildingSizeSqM ? Number(listing.buildingSizeSqM) : undefined,
    bedrooms: listing.bedrooms ?? undefined,
    bathrooms: listing.bathrooms ?? undefined,
    carSpaces: listing.carSpaces ?? undefined,
    yearBuilt: listing.yearBuilt ?? undefined,
  };
}

export async function createListing(developerId: string, patch: any = {}) {
  const title = patch.title?.trim() || "Untitled Listing";
  const slug = await uniqueSlug(slugify(title));
  let cityId = "";
  if (patch.city) { cityId = await resolveCityId(patch.city); }
  else { const fc = await prisma.city.findFirst({ select: { id: true } }); cityId = fc?.id ?? ""; }

  const listing = await prisma.property.create({
    data: {
      propertyDeveloperId: developerId, title, slug,
      description: patch.description ?? "", price: patch.price ?? 0,
      listingType: patch.listingType || "SALE", category: patch.category || "APARTMENT",
      address: patch.address ?? "", cityId,
      bedrooms: patch.bedrooms ?? null, bathrooms: patch.bathrooms ?? null,
      carSpaces: patch.carSpaces ?? null, yearBuilt: patch.yearBuilt ?? null,
      landSizeSqM: patch.landSizeSqm ?? null, buildingSizeSqM: patch.buildingSizeSqM ?? null,
      status: "DRAFT",
      media: patch.media?.length
        ? { create: patch.media.map((m: any) => ({ url: m.url, publicId: m.publicId, order: m.order })) }
        : undefined,
    },
    include: { media: { orderBy: { order: "asc" } }, cityRef: { select: { name: true } } },
  });
  return mapListing(listing);
}

export async function updateListing(developerId: string, id: string, patch: any) {
  const existing = await prisma.property.findFirst({
    where: { id, propertyDeveloperId: developerId, deletedAt: null },
    select: { id: true, cityId: true },
  });
  if (!existing) throw new NotFoundError("Listing not found");

  const updateData: any = {};
  for (const key of ["title", "description", "price", "address", "bedrooms", "bathrooms", "carSpaces", "yearBuilt"]) {
    if (patch[key] !== undefined) updateData[key] = patch[key];
  }
  // Coerce empty strings to valid enum defaults for Prisma
  if (patch.listingType !== undefined) updateData.listingType = patch.listingType || "SALE";
  if (patch.category !== undefined) updateData.category = patch.category || "APARTMENT";
  if (patch.landSizeSqm !== undefined) updateData.landSizeSqM = patch.landSizeSqm;
  if (patch.buildingSizeSqm !== undefined) updateData.buildingSizeSqM = patch.buildingSizeSqm;
  if (patch.city) updateData.cityId = await resolveCityId(patch.city);

  if (patch.media !== undefined) {
    await prisma.propertyMedia.deleteMany({ where: { propertyId: existing.id } });
    if (patch.media.length > 0) {
      await prisma.propertyMedia.createMany({
        data: patch.media.map((m: any) => ({
          propertyId: existing.id, url: m.url, publicId: m.publicId, order: m.order,
        })),
      });
    }
  }

  const listing = await prisma.property.update({
    where: { id: existing.id }, data: updateData,
    include: { media: { orderBy: { order: "asc" } }, cityRef: { select: { name: true } } },
  });
  return mapListing(listing);
}

export async function updateListingStatus(developerId: string, id: string, status: PropertyStatus) {
  const listing = await prisma.property.findFirst({
    where: { id, propertyDeveloperId: developerId, deletedAt: null },
  });
  if (!listing) throw new NotFoundError("Listing not found");
  if (!isValidTransition(listing.status, status)) {
    throw new BadRequestError("Cannot move a listing from " + listing.status + " to " + status + ".", "INVALID_TRANSITION");
  }
  const updateData: any = { status };
  if (status === "ACTIVE" && listing.status === "DRAFT") updateData.publishedAt = new Date();
  const updated = await prisma.property.update({
    where: { id }, data: updateData,
    include: { media: { orderBy: { order: "asc" } }, cityRef: { select: { name: true } } },
  });
  return mapListing(updated);
}

export async function deleteListing(developerId: string, id: string) {
  const listing = await prisma.property.findFirst({
    where: { id, propertyDeveloperId: developerId, deletedAt: null },
  });
  if (!listing) throw new NotFoundError("Listing not found");
  if (!DELETABLE_STATUSES.includes(listing.status)) {
    throw new BadRequestError("A " + listing.status.toLowerCase() + " listing can't be deleted directly.", "NOT_DELETABLE");
  }
  await prisma.property.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function bulkUpdateStatus(developerId: string, ids: string[], status: PropertyStatus) {
  const updated: string[] = [], skipped: string[] = [];
  const listings = await prisma.property.findMany({
    where: { id: { in: ids }, propertyDeveloperId: developerId, deletedAt: null },
  });
  const map = new Map(listings.map(l => [l.id, l]) as [string, any][]);
  for (const id of ids) {
    const l = map.get(id);
    if (l && isValidTransition(l.status, status)) {
      const d: any = { status };
      if (status === "ACTIVE" && l.status === "DRAFT") d.publishedAt = new Date();
      await prisma.property.update({ where: { id }, data: d });
      updated.push(id);
    } else skipped.push(id);
  }
  return { updated, skipped };
}

export async function bulkDelete(developerId: string, ids: string[]) {
  const deleted: string[] = [], skipped: string[] = [];
  const listings = await prisma.property.findMany({
    where: { id: { in: ids }, propertyDeveloperId: developerId, deletedAt: null },
  });
  const map = new Map(listings.map(l => [l.id, l]) as [string, any][]);
  for (const id of ids) {
    const l = map.get(id);
    if (l && DELETABLE_STATUSES.includes(l.status)) {
      await prisma.property.update({ where: { id }, data: { deletedAt: new Date() } });
      deleted.push(id);
    } else skipped.push(id);
  }
  return { deleted, skipped };
}

function mapListing(p: any) {
  return {
    id: p.id, slug: p.slug, title: p.title, description: p.description,
    price: Number(p.price), listingType: p.listingType, category: p.category,
    city: p.cityRef?.name ?? p.city ?? "", region: "", status: p.status,
    media: (p.media ?? []).map((m: any) => ({ url: m.url, publicId: m.publicId, order: m.order })),
    updatedAt: p.updatedAt?.toISOString?.() ?? p.updatedAt,
    bedrooms: p.bedrooms ?? undefined, bathrooms: p.bathrooms ?? undefined,
    carSpaces: p.carSpaces ?? undefined, yearBuilt: p.yearBuilt ?? undefined,
    landSizeSqm: p.landSizeSqM ? Number(p.landSizeSqM) : undefined,
    buildingSizeSqm: p.buildingSizeSqM ? Number(p.buildingSizeSqM) : undefined,
  };
}
