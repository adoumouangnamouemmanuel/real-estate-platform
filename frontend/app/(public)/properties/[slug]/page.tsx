import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PropertyDetailView } from "@/components/property/PropertyDetailView";
import { APP_NAME } from "@/constants/config";
import { propertyService } from "@/services";

interface PropertyDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PropertyDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const property = await propertyService.getPropertyBySlug(slug);
    return {
      title: `${property.title} | ${APP_NAME}`,
      description: property.description,
    };
  } catch {
    return { title: `Property not found | ${APP_NAME}` };
  }
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { slug } = await params;

  const property = await propertyService
    .getPropertyBySlug(slug)
    .catch(() => notFound());

  const relatedProperties =
    await propertyService.getRelatedProperties(property);

  return (
    <PropertyDetailView
      property={property}
      relatedProperties={relatedProperties}
    />
  );
}
