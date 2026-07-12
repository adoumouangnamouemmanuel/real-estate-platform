import type { Metadata } from "next";

import { PropertiesView } from "@/components/property/PropertiesView";
import {
  parsePropertyFilters,
  type RawPropertySearchParams,
} from "@/lib/propertyFilters";

export const metadata: Metadata = {
  title: "Properties | ByTe",
  description: "Browse verified property listings across African markets.",
};

interface PropertiesPageProps {
  searchParams: Promise<RawPropertySearchParams>;
}

export default async function PropertiesPage({
  searchParams,
}: PropertiesPageProps) {
  const filters = parsePropertyFilters(await searchParams);

  return <PropertiesView filters={filters} heading="Properties" />;
}
