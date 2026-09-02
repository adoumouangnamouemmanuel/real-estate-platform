import { prisma } from "../../config/prisma.js";
import { NotFoundError } from "../../utils/errors.js";
import { parsePagination, paginateResult } from "../../utils/pagination.js";
import type { PaginatedResult } from "../../utils/pagination.js";

export interface PropertyFilters {
  q?: string;
  category?: string;
  listingType?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  sort?: "newest" | "price_asc" | "price_desc";
}

export interface GetPropertiesParams extends PropertyFilters {
  page?: number;
  pageSize?: number;
}

const PUBLIC_STATUSES = ["ACTIVE"];

export async function getProperties(params: GetPropertiesParams = {}): Promise<PaginatedResult<any>> {
  const { skip, take, page, pageSize } = parsePagination(params);

  const where: any = {
    status: { in: PUBLIC_STATUSES },
    deletedAt: null,
  };

  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
      { address: { contains: params.q, mode: "insensitive" } },
    ];
  }

  if (params.category) where.category = params.category;
  if (params.listingType) where.listingType = params.listingType;
  if (params.city) {
    where.cityRef = { name: { contains: params.city, mode: "insensitive" } };
  }

  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    where.price = {};
    if (params.minPrice !== undefined) where.price.gte = params.minPrice;
    if (params.maxPrice !== undefined) where.price.lte = params.maxPrice;
  }

  if (params.minBedrooms !== undefined) {
    where.bedrooms = { gte: params.minBedrooms };
  }

  let orderBy: any = { createdAt: "desc" };
  if (params.sort === "price_asc") orderBy = { price: "asc" };
  else if (params.sort === "price_desc") orderBy = { price: "desc" };

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where, skip, take, orderBy,
      include: {
        media: { orderBy: { order: "asc" } },
        cityRef: { select: { name: true } },
      },
    }),
    prisma.property.count({ where }),
  ]);

  return paginateResult(items.map(mapPropertyListItem), total, page, pageSize);
}

export async function getPropertyBySlug(slug: string): Promise<any> {
  const property = await prisma.property.findUnique({
    where: { slug },
    include: {
      media: { orderBy: { order: "asc" } },
      cityRef: { select: { name: true } },
      district: { select: { name: true } },
      developer: {
        select: {
          id: true, businessName: true, userId: true, city: true,
          isVerified: true, averageRating: true, profileImageUrl: true,
          user: { select: { fullName: true } },
        },
      },
      features: { include: { feature: true } },
    },
  });

  if (!property || property.deletedAt) throw new NotFoundError("Property not found");
  return mapPropertyDetail(property);
}

export async function getRelatedProperties(propertyId: string, limit = 4): Promise<any[]> {
  const source = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { category: true },
  });
  if (!source) throw new NotFoundError("Property not found");

  const items = await prisma.property.findMany({
    where: {
      id: { not: propertyId },
      category: source.category,
      status: { in: PUBLIC_STATUSES },
      deletedAt: null,
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      media: { orderBy: { order: "asc" } },
      cityRef: { select: { name: true } },
    },
  });

  return items.map(mapPropertyListItem);
}

function mapPropertyListItem(p: any) {
  return {
    id: p.id, slug: p.slug, title: p.title, description: p.description,
    price: Number(p.price), listingType: p.listingType, category: p.category,
    city: p.cityRef?.name ?? p.city ?? "", region: "",
    district: p.district?.name ?? undefined, status: p.status,
    media: p.media.map((m: any) => ({ url: m.url, publicId: m.publicId, order: m.order })),
    favoriteCount: p.favoriteCount,
    bedrooms: p.bedrooms ?? undefined, bathrooms: p.bathrooms ?? undefined,
    carSpaces: p.carSpaces ?? undefined, yearBuilt: p.yearBuilt ?? undefined,
    landSizeSqm: p.landSizeSqM ? Number(p.landSizeSqM) : undefined,
    buildingSizeSqm: p.buildingSizeSqM ? Number(p.buildingSizeSqM) : undefined,
  };
}

function mapPropertyDetail(p: any) {
  const base = mapPropertyListItem(p);
  const dev = p.developer;
  const developer = dev ? {
    id: dev.id,
    slug: (dev.businessName || dev.id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    name: dev.businessName || dev.user?.fullName || "Developer",
    logoUrl: dev.profileImageUrl ?? undefined,
    city: dev.city, region: "", isVerified: dev.isVerified,
    rating: Number(dev.averageRating) || undefined, activeListings: 0,
  } : undefined;

  const amenities = (p.features ?? []).map((f: any) => f.feature.featureName);

  return {
    ...base, address: p.address, amenities, developer,
    bedrooms: p.bedrooms ?? undefined, bathrooms: p.bathrooms ?? undefined,
    carSpaces: p.carSpaces ?? undefined, yearBuilt: p.yearBuilt ?? undefined,
    landSizeSqm: p.landSizeSqM ? Number(p.landSizeSqM) : undefined,
    buildingSizeSqm: p.buildingSizeSqM ? Number(p.buildingSizeSqM) : undefined,
  };
}
