import type { Metadata } from "next";

import { PropertiesView } from "@/components/property/PropertiesView";
import { APP_NAME } from "@/constants/config";
import {
  parsePropertyFilters,
  type RawPropertySearchParams,
} from "@/lib/propertyFilters";

export const metadata: Metadata = {
  title: `Properties | ${APP_NAME}`,
  description: "Browse property listings across African markets.",
};

interface PropertiesPageProps {
  searchParams: Promise<RawPropertySearchParams>;
}

export default async function PropertiesPage({
  searchParams,
}: PropertiesPageProps) {
  const filters = parsePropertyFilters(await searchParams);

  return (
    <PropertiesView
      filters={filters}
      eyebrow="Listings"
      heading="Properties"
      // Both claims are structural, not marketing: every Property carries a
      // required `developer`, and location/type/budget are the filters this
      // page actually exposes.
      lede="Every listing is published by a named developer. Narrow the catalogue by location, property type and budget."
    />
  );
}
