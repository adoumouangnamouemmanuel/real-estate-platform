import crypto from "node:crypto";
import { prisma } from "../../config/prisma.js";
import { requireDeveloperId } from "../../middleware/auth.js";
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from "../../utils/errors.js";
import { parsePagination, paginateResult } from "../../utils/pagination.js";
import { localeConfig, normalizeCategory } from "../../lib/localization.js";
import {
  mapProperty,
  propertyInclude,
} from "../properties/property.service.js";
import { validateMediaReferences } from "../uploads/upload.service.js";
import { listingPatchSchema } from "./listing.schema.js";
type Status = "DRAFT" | "ACTIVE" | "RESERVED" | "SOLD" | "SUSPENDED";
const transitions: Record<Status, Status[]> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["RESERVED", "SOLD", "SUSPENDED"],
  RESERVED: ["ACTIVE", "SOLD"],
  SUSPENDED: ["ACTIVE"],
  SOLD: [],
};
const include = { ...propertyInclude, translations: true };
export interface GetListingsParams {
  q?: string;
  status?: string;
  category?: string;
  listingType?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}
export async function getListings(
  developerId: string,
  params: GetListingsParams = {},
) {
  requireDeveloperId(developerId);
  const locale = await localeConfig(),
    { skip, take, page, pageSize } = parsePagination(params);
  const where: any = { propertyDeveloperId: developerId, deletedAt: null };
  if (params.status) where.status = params.status;
  if (params.category) where.category = normalizeCategory(params.category);
  if (params.listingType) where.listingType = params.listingType;
  if (params.q)
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { cityRef: { name: { contains: params.q, mode: "insensitive" } } },
    ];
  const orderBy: any =
    params.sort === "price_asc"
      ? { price: "asc" }
      : params.sort === "price_desc"
        ? { price: "desc" }
        : params.sort === "title_asc"
          ? { title: "asc" }
          : { updatedAt: "desc" };
  const [items, total] = await Promise.all([
    prisma.property.findMany({ where, skip, take, orderBy, include }),
    prisma.property.count({ where }),
  ]);
  return paginateResult(
    await Promise.all(items.map((p) => mapProperty(p, locale, false, true))),
    total,
    page,
    pageSize,
  );
}
export async function getStatusCounts(developerId: string) {
  requireDeveloperId(developerId);
  const rows = await prisma.property.groupBy({
    by: ["status"],
    where: { propertyDeveloperId: developerId, deletedAt: null },
    _count: { status: true },
  });
  const result: Record<Status, number> = {
    DRAFT: 0,
    ACTIVE: 0,
    RESERVED: 0,
    SOLD: 0,
    SUSPENDED: 0,
  };
  for (const r of rows) result[r.status] = r._count.status;
  return result;
}
export async function getListingForEdit(developerId: string, id: string) {
  requireDeveloperId(developerId);
  const locale = await localeConfig(),
    p = await prisma.property.findFirst({
      where: { id, propertyDeveloperId: developerId, deletedAt: null },
      include,
    });
  if (!p) throw new NotFoundError("Listing not found");
  return mapProperty(p, locale, true);
}
async function language(code: string) {
  if (!(await prisma.language.findFirst({ where: { code, isActive: true } })))
    throw new BadRequestError(
      "Unsupported content language",
      "UNSUPPORTED_LANGUAGE",
    );
}
async function location(patch: any, existing?: any) {
  let cityId = patch.cityId || existing?.cityId;
  if (patch.city && !patch.cityId) {
    const c = await prisma.city.findFirst({
      where: {
        name: { equals: patch.city, mode: "insensitive" },
        isActive: true,
      },
    });
    cityId = c?.id;
  }
  if (!cityId)
    throw new BadRequestError("Choose a city before saving", "CITY_REQUIRED");
  if (!(await prisma.city.findFirst({ where: { id: cityId, isActive: true } })))
    throw new BadRequestError("City not found");
  let districtId =
    patch.districtId === undefined
      ? cityId === existing?.cityId
        ? existing?.districtId
        : null
      : patch.districtId || null;
  if (patch.district !== undefined && patch.districtId === undefined) {
    if (!patch.district) districtId = null;
    else {
      const d = await prisma.district.findFirst({
        where: {
          cityId,
          name: { equals: patch.district, mode: "insensitive" },
          isActive: true,
        },
      });
      if (!d) throw new BadRequestError("District not found");
      districtId = d.id;
    }
  }
  if (
    districtId &&
    !(await prisma.district.findFirst({
      where: { id: districtId, cityId, isActive: true },
    }))
  )
    throw new BadRequestError("District does not belong to city");
  return { cityId, districtId };
}
async function featureData(patch: any) {
  if (patch.amenities?.length && patch.featureIds === undefined)
    throw new BadRequestError(
      "Submit feature IDs, not translated labels",
      "FEATURE_IDS_REQUIRED",
    );
  if (patch.featureIds === undefined) return undefined;
  const ids = [...new Set(patch.featureIds)] as string[];
  if (
    (await prisma.feature.count({ where: { id: { in: ids } } })) !== ids.length
  )
    throw new BadRequestError("Unknown feature");
  return ids.map((featureId) => ({ featureId }));
}
export async function createListing(developerId: string, input: any = {}) {
  requireDeveloperId(developerId);
  const patch = listingPatchSchema.parse(input);
  await language(patch.contentLanguage);
  const locale = await localeConfig();
  return prisma.$transaction(async (tx) => {
    const place = await location(patch),
      features = await featureData(patch),
      media = await validateMediaReferences(developerId, patch.media ?? [], []);
    const title =
        patch.title ||
        (patch.contentLanguage === "fr"
          ? "Annonce sans titre"
          : "Untitled Listing"),
      description = patch.description ?? "";
    const slug =
      (title
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 100) || "listing") +
      "-" +
      crypto.randomUUID().slice(0, 8);
    const p = await tx.property.create({
      data: {
        propertyDeveloperId: developerId,
        title,
        slug,
        description,
        price: patch.price ?? 0,
        category: normalizeCategory(patch.category) || "APARTMENT",
        listingType: patch.listingType || "SALE",
        address: patch.address ?? "",
        ...place,
        bedrooms: patch.bedrooms,
        bathrooms: patch.bathrooms,
        carSpaces: patch.carSpaces,
        yearBuilt: patch.yearBuilt,
        landSizeSqM: patch.landSizeSqm,
        buildingSizeSqM: patch.buildingSizeSqm,
        sourceLanguageCode: patch.contentLanguage,
        currencyCode: "XOF",
        rentPeriod: patch.rentPeriod,
        media: { create: media },
        features: features ? { create: features } : undefined,
        translations: {
          create: { languageCode: patch.contentLanguage, title, description },
        },
      },
      include,
    });
    return mapProperty(
      p,
      { ...locale, requested: patch.contentLanguage },
      true,
    );
  });
}
async function lockedListing(developerId: string, id: string) {
  await prisma.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${id},0))::text`;
  const p = await prisma.property.findFirst({
    where: { id, propertyDeveloperId: developerId, deletedAt: null },
    include,
  });
  if (!p) throw new NotFoundError("Listing not found");
  return p;
}
export async function updateListing(
  developerId: string,
  id: string,
  input: any,
) {
  requireDeveloperId(developerId);
  const patch = listingPatchSchema.parse(input);
  await language(patch.contentLanguage);
  if (!patch.rowVersion)
    throw new BadRequestError(
      "Listing version is required",
      "ROW_VERSION_REQUIRED",
    );
  const locale = await localeConfig();
  return prisma.$transaction(async (tx) => {
    const p = await lockedListing(developerId, id);
    if (p.rowVersion !== patch.rowVersion)
      throw new ConflictError("Listing changed. Reload before saving.");
    const data: any = {
      ...(await location(patch, p)),
      rowVersion: { increment: 1 },
    };
    for (const key of [
      "price",
      "address",
      "bedrooms",
      "bathrooms",
      "carSpaces",
      "yearBuilt",
      "rentPeriod",
      "currencyCode",
    ])
      if ((patch as any)[key] !== undefined) data[key] = (patch as any)[key];
    if (patch.category !== undefined)
      data.category = normalizeCategory(patch.category) || p.category;
    if (patch.listingType) data.listingType = patch.listingType;
    if (patch.landSizeSqm !== undefined) data.landSizeSqM = patch.landSizeSqm;
    if (patch.buildingSizeSqm !== undefined)
      data.buildingSizeSqM = patch.buildingSizeSqm;
    if (patch.media !== undefined) {
      const media = await validateMediaReferences(
        developerId,
        patch.media,
        p.media,
      );
      await tx.propertyMedia.deleteMany({ where: { propertyId: id } });
      if (media.length)
        await tx.propertyMedia.createMany({
          data: media.map((m) => ({ ...m, propertyId: id })),
        });
    }
    const features = await featureData(patch);
    if (features !== undefined) {
      await tx.propertyFeature.deleteMany({ where: { propertyId: id } });
      if (features.length)
        await tx.propertyFeature.createMany({
          data: features.map((f) => ({ ...f, propertyId: id })),
        });
    }
    if (patch.title !== undefined || patch.description !== undefined) {
      const old = p.translations.find(
        (t) => t.languageCode === patch.contentLanguage,
      );
      const title = patch.title ?? old?.title ?? "",
        description = patch.description ?? old?.description ?? "";
      const isPublished =
        !!old?.isPublished && !!title.trim() && !!description.trim();
      await tx.propertyTranslation.upsert({
        where: {
          propertyId_languageCode: {
            propertyId: id,
            languageCode: patch.contentLanguage,
          },
        },
        create: {
          propertyId: id,
          languageCode: patch.contentLanguage,
          title,
          description,
          isPublished,
        },
        update: { title, description, isPublished },
      });
      if (patch.contentLanguage === p.sourceLanguageCode) {
        data.title = title;
        data.description = description;
        await tx.propertyTranslation.updateMany({
          where: {
            propertyId: id,
            languageCode: { not: patch.contentLanguage },
          },
          data: { isPublished: false },
        });
      }
    }
    const updated = await tx.property.update({ where: { id }, data, include });
    if (updated.status === "ACTIVE") ready(updated);
    return mapProperty(
      updated,
      { ...locale, requested: patch.contentLanguage },
      true,
    );
  });
}
function ready(p: any) {
  const t = p.translations.find(
    (t: any) => t.languageCode === p.sourceLanguageCode,
  );
  if (
    !p.currencyCode ||
    (p.listingType === "RENT" && !p.rentPeriod) ||
    !t?.title.trim() ||
    !t?.description.trim() ||
    Number(p.price) <= 0 ||
    !p.address.trim() ||
    !p.media.length ||
    (p.category === "LAND" && !p.landSizeSqM)
  )
    throw new BadRequestError(
      "Complete the source content, price, address and photos before publication",
      "INCOMPLETE_LISTING",
    );
}
export async function updateListingStatus(
  developerId: string,
  id: string,
  status: Status,
) {
  requireDeveloperId(developerId);
  const locale = await localeConfig();
  return prisma.$transaction(async (tx) => {
    const p = await lockedListing(developerId, id);
    if (!transitions[p.status]?.includes(status))
      throw new BadRequestError(
        "Invalid listing transition",
        "INVALID_TRANSITION",
      );
    if (status === "ACTIVE") {
      ready(p);
      await tx.propertyTranslation.update({
        where: {
          propertyId_languageCode: {
            propertyId: id,
            languageCode: p.sourceLanguageCode!,
          },
        },
        data: { isPublished: true },
      });
    }
    const updated = await tx.property.update({
      where: { id },
      data: {
        status,
        rowVersion: { increment: 1 },
        publishedAt:
          status === "ACTIVE" && !p.publishedAt ? new Date() : p.publishedAt,
      },
      include,
    });
    return mapProperty(updated, locale, false, true);
  });
}
export async function publishTranslation(
  developerId: string,
  id: string,
  code: string,
) {
  requireDeveloperId(developerId);
  await language(code);
  return prisma.$transaction(async (tx) => {
    const p = await lockedListing(developerId, id),
      t = p.translations.find((t) => t.languageCode === code);
    if (!t?.title.trim() || !t.description.trim())
      throw new BadRequestError(
        "Complete both translated fields",
        "INCOMPLETE_TRANSLATION",
      );
    await tx.propertyTranslation.update({
      where: {
        propertyId_languageCode: { propertyId: id, languageCode: code },
      },
      data: { isPublished: true },
    });
    return { languageCode: code, isPublished: true };
  });
}
export async function deleteListing(developerId: string, id: string) {
  requireDeveloperId(developerId);
  return prisma.$transaction(async (tx) => {
    const p = await lockedListing(developerId, id);
    if (!["DRAFT", "SUSPENDED"].includes(p.status))
      throw new BadRequestError(
        "Suspend the listing before deleting",
        "NOT_DELETABLE",
      );
    await tx.property.update({
      where: { id },
      data: { deletedAt: new Date(), rowVersion: { increment: 1 } },
    });
  });
}
export async function bulkUpdateStatus(
  developerId: string,
  ids: string[],
  status: Status,
) {
  requireDeveloperId(developerId);
  const updated: string[] = [],
    skipped: string[] = [];
  for (const id of [...new Set(ids)])
    try {
      await updateListingStatus(developerId, id, status);
      updated.push(id);
    } catch (e) {
      if (e instanceof BadRequestError || e instanceof NotFoundError)
        skipped.push(id);
      else throw e;
    }
  return { updated, skipped };
}
export async function bulkDelete(developerId: string, ids: string[]) {
  requireDeveloperId(developerId);
  const deleted: string[] = [],
    skipped: string[] = [];
  for (const id of [...new Set(ids)])
    try {
      await deleteListing(developerId, id);
      deleted.push(id);
    } catch (e) {
      if (e instanceof BadRequestError || e instanceof NotFoundError)
        skipped.push(id);
      else throw e;
    }
  return { deleted, skipped };
}
