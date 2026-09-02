import { prisma } from "../../config/prisma.js";
import { NotFoundError } from "../../utils/errors.js";
import { parsePagination, paginateResult } from "../../utils/pagination.js";
import type { PaginatedResult } from "../../utils/pagination.js";

export interface GetDevelopersParams { q?: string; city?: string; sort?: string; page?: number; pageSize?: number; }

export async function getDevelopers(params: GetDevelopersParams = {}): Promise<PaginatedResult<any>> {
  const { skip, take, page, pageSize } = parsePagination(params);
  const where: any = { deletedAt: null };
  if (params.city) where.city = { contains: params.city, mode: "insensitive" };
  if (params.q) {
    where.OR = [
      { businessName: { contains: params.q, mode: "insensitive" } },
      { city: { contains: params.q, mode: "insensitive" } },
      { bio: { contains: params.q, mode: "insensitive" } },
    ];
  }

  let orderBy: any = { averageRating: "desc" };
  if (params.sort === "name_asc") orderBy = { businessName: "asc" };
  else if (params.sort === "listings_desc") orderBy = { properties: { _count: "desc" } };

  const [items, total] = await Promise.all([
    prisma.propertyDeveloper.findMany({
      where, skip, take, orderBy,
      include: { user: { select: { fullName: true } }, _count: { select: { properties: { where: { status: "ACTIVE", deletedAt: null } } } } },
    }),
    prisma.propertyDeveloper.count({ where }),
  ]);
  return paginateResult(items.map(mapDeveloper), total, page, pageSize);
}

export async function getDeveloperBySlug(slug: string) {
  const developers = await prisma.propertyDeveloper.findMany({
    where: { deletedAt: null },
    include: { user: { select: { fullName: true, email: true } }, _count: { select: { properties: { where: { deletedAt: null } } } } },
  });
  const developer = developers.find(d => {
    const dSlug = (d.businessName || d.user?.fullName || d.id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return dSlug === slug;
  });
  if (!developer) throw new NotFoundError("Developer not found");
  return mapDeveloperProfile(developer);
}

export async function getDeveloperListings(developerId: string, params: { page?: number; pageSize?: number } = {}): Promise<PaginatedResult<any>> {
  const { skip, take, page, pageSize } = parsePagination(params);
  const where = { propertyDeveloperId: developerId, status: "ACTIVE" as const, deletedAt: null };
  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where, skip, take, orderBy: { createdAt: "desc" },
      include: { media: { orderBy: { order: "asc" } }, cityRef: { select: { name: true } } },
    }),
    prisma.property.count({ where }),
  ]);
  return paginateResult(items.map(p => ({
    id: p.id, slug: p.slug, title: p.title, description: p.description,
    price: Number(p.price), listingType: p.listingType, category: p.category,
    city: p.cityRef?.name ?? "", region: "", status: p.status,
    media: (p.media ?? []).map((m: any) => ({ url: m.url, publicId: m.publicId, order: m.order })),
    favoriteCount: p.favoriteCount, bedrooms: p.bedrooms ?? undefined,
  })), total, page, pageSize);
}

function mapDeveloper(d: any) {
  const slug = (d.businessName || d.user?.fullName || d.id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return { id: d.id, slug, name: d.businessName || d.user?.fullName || "Developer", logoUrl: d.profileImageUrl ?? undefined, city: d.city, region: "", isVerified: d.isVerified, rating: Number(d.averageRating) || undefined, activeListings: d._count?.properties ?? 0, bio: d.bio ?? undefined };
}

function mapDeveloperProfile(d: any) {
  return { ...mapDeveloper(d), bio: d.bio || "", coverImageUrl: d.coverImageUrl ?? undefined, email: d.user?.email ?? "", socialLinks: { website: undefined, facebook: undefined, instagram: undefined }, totalListings: d._count?.properties ?? 0, yearsActive: d.yearsOfExperience ?? 0 };
}
