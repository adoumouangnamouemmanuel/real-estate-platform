import { getEnv } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { NotFoundError, BadRequestError } from "../../utils/errors.js";
import { parsePagination, paginateResult } from "../../utils/pagination.js";
import {
  localeConfig,
  localeMetadata,
  resolveTranslation,
  normalizeCategory,
} from "../../lib/localization.js";
import { mediaForRead } from "../uploads/upload.service.js";
export interface GetPropertiesParams {
  q?: string;
  category?: string;
  listingType?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
  developerId?: string;
}
export const publicPropertyWhere = {
  status: "ACTIVE" as const,
  deletedAt: null,
  developer: { deletedAt: null, sellerStatus: "ACTIVE" },
  currencyCode: { not: null },
  sourceLanguageCode: { not: null },
  translations: { some: { isPublished: true } },
};
export const propertyInclude = {
  media: { orderBy: { order: "asc" as const } },
  cityRef: true,
  district: true,
  translations: { where: { isPublished: true } },
  features: { include: { feature: { include: { translations: true } } } },
  developer: {
    select: {
      id: true,
      slug: true,
      businessName: true,
      city: true,
      isVerified: true,
      averageRating: true,
      profileImageUrl: true,
    },
  },
};
export async function mapProperty(
  p: any,
  locale: { requested: string; fallback: string },
  editing = false,
  ownerPreview = false,
): Promise<any> {
  let selected: any = editing
    ? p.translations?.find((t: any) => t.languageCode === locale.requested)
    : resolveTranslation<any>(
        p.translations ?? [],
        locale.requested,
        locale.fallback,
        p.sourceLanguageCode,
      );
  if (!editing && !selected && ownerPreview)
    selected = p.translations?.find(
      (t: any) => t.languageCode === p.sourceLanguageCode,
    );
  if (!editing && getEnv().CONTENT_READ_MODE === "legacy")
    selected = {
      title: p.title,
      description: p.description,
      languageCode: p.sourceLanguageCode,
    };
  // Editors never silently edit a fallback row. A missing translation opens blank.
  const text =
    selected ??
    (editing && locale.requested === p.sourceLanguageCode
      ? {
          title: p.title,
          description: p.description,
          languageCode: p.sourceLanguageCode,
        }
      : undefined);
  const features = (p.features ?? []).map((f: any) => {
    const t = resolveTranslation<any>(
      f.feature.translations ?? [],
      locale.requested,
      locale.fallback,
      f.feature.sourceLanguageCode,
    );
    return {
      id: f.feature.id,
      code: f.feature.code,
      iconName: f.feature.iconName,
      name: t?.name ?? f.feature.featureName,
      ...localeMetadata(
        locale.requested,
        t?.languageCode ?? f.feature.sourceLanguageCode,
      ),
    };
  });
  return {
    id: p.id,
    slug: p.slug,
    title: text?.title ?? "",
    description: text?.description ?? "",
    price: Number(p.price),
    priceDecimal: p.price.toFixed(2),
    currencyCode: p.currencyCode,
    rentPeriod: p.rentPeriod,
    rowVersion: p.rowVersion,
    sourceLanguage: p.sourceLanguageCode,
    category: p.category.toLowerCase(),
    listingType: p.listingType,
    status: p.status,
    city: p.cityRef?.name ?? "",
    cityId: p.cityId,
    district: p.district?.name,
    districtId: p.districtId,
    region: "",
    address: p.address,
    media: await Promise.all((p.media ?? []).map(mediaForRead)),
    features,
    featureIds: features.map((f: any) => f.id),
    amenities: features.map((f: any) => f.name),
    ...localeMetadata(locale.requested, text?.languageCode),
    translationExists: !!text,
    translationPublished: !!selected?.isPublished,
    favoriteCount: p.favoriteCount,
    updatedAt: p.updatedAt?.toISOString?.(),
    bedrooms: p.bedrooms ?? undefined,
    bathrooms: p.bathrooms ?? undefined,
    carSpaces: p.carSpaces ?? undefined,
    yearBuilt: p.yearBuilt ?? undefined,
    landSizeSqm: p.landSizeSqM ? Number(p.landSizeSqM) : undefined,
    buildingSizeSqm: p.buildingSizeSqM ? Number(p.buildingSizeSqM) : undefined,
    developer: p.developer
      ? {
          id: p.developer.id,
          slug: p.developer.slug,
          name: p.developer.businessName || p.developer.slug,
          logoUrl: p.developer.profileImageUrl || undefined,
          city: p.developer.city,
          region: "",
          isVerified: p.developer.isVerified,
          rating: Number(p.developer.averageRating) || undefined,
          activeListings: 0,
        }
      : undefined,
  };
}
export async function getProperties(params: GetPropertiesParams = {}) {
  const locale = await localeConfig(),
    { skip, take, page, pageSize } = parsePagination(params);
  const where: any = { ...publicPropertyWhere };
  if (params.developerId) where.propertyDeveloperId = params.developerId;
  if (params.category) where.category = normalizeCategory(params.category);
  if (params.listingType) {
    if (!["SALE", "RENT"].includes(params.listingType))
      throw new BadRequestError("Invalid listing type");
    where.listingType = params.listingType;
  }
  if (params.city)
    where.cityRef = { name: { equals: params.city, mode: "insensitive" } };
  if (params.minPrice !== undefined || params.maxPrice !== undefined)
    where.price = {
      ...(params.minPrice !== undefined ? { gte: params.minPrice } : {}),
      ...(params.maxPrice !== undefined ? { lte: params.maxPrice } : {}),
    };
  if (params.minBedrooms !== undefined)
    where.bedrooms = { gte: params.minBedrooms };
  if (params.q)
    where.OR = [
      { address: { contains: params.q, mode: "insensitive" } },
      {
        translations: {
          some: {
            isPublished: true,
            languageCode: { in: [locale.requested, locale.fallback] },
            OR: [
              { title: { contains: params.q, mode: "insensitive" } },
              { description: { contains: params.q, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  const orderBy: any =
    params.sort === "price_asc"
      ? [{ price: "asc" }, { id: "asc" }]
      : params.sort === "price_desc"
        ? [{ price: "desc" }, { id: "asc" }]
        : [{ createdAt: "desc" }, { id: "asc" }];
  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take,
      orderBy,
      include: propertyInclude,
    }),
    prisma.property.count({ where }),
  ]);
  return paginateResult(
    await Promise.all(items.map((p) => mapProperty(p, locale))),
    total,
    page,
    pageSize,
  );
}
export async function getPropertyBySlug(slug: string) {
  const locale = await localeConfig();
  const p = await prisma.property.findFirst({
    where: { ...publicPropertyWhere, slug },
    include: propertyInclude,
  });
  if (!p) throw new NotFoundError("Property not found");
  return mapProperty(p, locale);
}
export async function getPropertyById(id: string) {
  const locale = await localeConfig(),
    p = await prisma.property.findFirst({
      where: { ...publicPropertyWhere, id },
      include: propertyInclude,
    });
  if (!p) throw new NotFoundError("Property not found");
  return mapProperty(p, locale);
}
export async function getRelatedProperties(id: string, limit = 4) {
  const locale = await localeConfig();
  const source = await prisma.property.findFirst({
    where: { ...publicPropertyWhere, id },
    select: { category: true },
  });
  if (!source) throw new NotFoundError("Property not found");
  if (!Number.isInteger(limit) || limit < 1 || limit > 12)
    throw new BadRequestError("Invalid related limit");
  const items = await prisma.property.findMany({
    where: {
      ...publicPropertyWhere,
      id: { not: id },
      category: source.category,
    },
    take: limit,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    include: propertyInclude,
  });
  return Promise.all(items.map((p) => mapProperty(p, locale)));
}
