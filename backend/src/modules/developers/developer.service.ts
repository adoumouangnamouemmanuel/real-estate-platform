import { prisma } from "../../config/prisma.js";
import { NotFoundError } from "../../utils/errors.js";
import { parsePagination, paginateResult } from "../../utils/pagination.js";
import {
  localeConfig,
  resolveTranslation,
  localeMetadata,
} from "../../lib/localization.js";
import {
  getProperties,
  publicPropertyWhere,
} from "../properties/property.service.js";
export interface GetDevelopersParams {
  q?: string;
  city?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}
const include = {
  translations: true,
  _count: { select: { properties: { where: publicPropertyWhere } } },
};
function map(d: any, locale: { requested: string; fallback: string }) {
  const t = resolveTranslation<any>(
    d.translations ?? [],
    locale.requested,
    locale.fallback,
    d.sourceLanguageCode,
  );
  return {
    id: d.id,
    slug: d.slug,
    name: d.businessName || d.slug,
    logoUrl: d.profileImageUrl || undefined,
    city: d.city,
    region: "",
    isVerified: d.isVerified,
    rating: Number(d.averageRating) || undefined,
    activeListings: d._count?.properties ?? 0,
    bio: t?.bio ?? "",
    specialization: t?.specialization ?? undefined,
    coverImageUrl: d.coverImageUrl ?? undefined,
    email: d.publicEmail ?? "",
    socialLinks: {},
    totalListings: d._count?.properties ?? 0,
    yearsActive: d.yearsOfExperience ?? 0,
    ...localeMetadata(locale.requested, t?.languageCode),
  };
}
export async function getDevelopers(params: GetDevelopersParams = {}) {
  const locale = await localeConfig(),
    { skip, take, page, pageSize } = parsePagination(params),
    where: any = { deletedAt: null, sellerStatus: "ACTIVE" };
  if (params.city) where.city = { contains: params.city, mode: "insensitive" };
  if (params.q)
    where.OR = [
      { businessName: { contains: params.q, mode: "insensitive" } },
      { city: { contains: params.q, mode: "insensitive" } },
    ];
  const orderBy: any =
    params.sort === "name_asc"
      ? { businessName: "asc" }
      : { averageRating: "desc" };
  const [items, total] = await Promise.all([
    prisma.propertyDeveloper.findMany({ where, skip, take, orderBy, include }),
    prisma.propertyDeveloper.count({ where }),
  ]);
  return paginateResult(
    items.map((d) => map(d, locale)),
    total,
    page,
    pageSize,
  );
}
export async function getDeveloperBySlug(slug: string) {
  const locale = await localeConfig();
  const d = await prisma.propertyDeveloper.findFirst({
    where: { slug, deletedAt: null, sellerStatus: "ACTIVE" },
    include,
  });
  if (!d) throw new NotFoundError("Developer not found");
  return map(d, locale);
}
export async function getDeveloperListings(
  developerId: string,
  params: { page?: number; pageSize?: number } = {},
) {
  return getProperties({ ...params, developerId });
}
