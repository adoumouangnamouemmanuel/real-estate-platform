import { prisma } from "../../config/prisma.js";

export async function getFeatures(category?: string) {
  const where: any = {};
  if (category) {
    where.properties = {
      some: { property: { category: category as any } },
    };
  }

  const features = await prisma.feature.findMany({ where, orderBy: { featureName: "asc" } });

  return features.map(f => ({
    id: f.id,
    name: f.featureName,
    category: f.category ?? "",
    iconName: f.iconName ?? "circle",
    propertyCategories: [], // Derived from the join table — for MVP, frontend uses its own mapping
  }));
}

export async function getFeatureByName(name: string) {
  const feature = await prisma.feature.findFirst({
    where: { featureName: { equals: name, mode: "insensitive" } },
  });
  if (!feature) return null;
  return {
    id: feature.id,
    name: feature.featureName,
    category: feature.category ?? "",
    iconName: feature.iconName ?? "circle",
    propertyCategories: [],
  };
}
