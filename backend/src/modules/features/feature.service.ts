import { prisma } from "../../config/prisma.js";
import {
  localeConfig,
  localeMetadata,
  resolveTranslation,
  normalizeCategory,
} from "../../lib/localization.js";
export async function getFeatures(category?: string) {
  normalizeCategory(category);
  const locale = await localeConfig();
  const features = await prisma.feature.findMany({
    orderBy: { code: "asc" },
    include: { translations: true },
  });
  // The catalogue does not infer eligibility from which listings already use it.
  return features.map((f) => {
    const t = resolveTranslation(
      f.translations,
      locale.requested,
      locale.fallback,
      f.sourceLanguageCode,
    );
    return {
      id: f.id,
      code: f.code,
      name: t?.name ?? f.featureName,
      category: f.category ?? "",
      iconName: f.iconName ?? "circle",
      propertyCategories: [
        "apartment",
        "house",
        "land",
        "commercial",
        "office",
      ],
      ...localeMetadata(
        locale.requested,
        t?.languageCode ?? f.sourceLanguageCode,
      ),
    };
  });
}
export async function getFeatureByName(name: string) {
  return (
    (await getFeatures()).find(
      (f) => f.name.toLowerCase() === name.toLowerCase(),
    ) ?? null
  );
}
