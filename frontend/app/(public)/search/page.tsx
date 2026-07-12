import type { Metadata } from "next";

import { PropertiesView } from "@/components/property/PropertiesView";
import {
  parsePropertyFilters,
  type RawPropertySearchParams,
} from "@/lib/propertyFilters";

export const metadata: Metadata = {
  title: "Search | ByTe",
  description: "Search property listings across African markets.",
};

interface SearchPageProps {
  searchParams: Promise<RawPropertySearchParams>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const filters = parsePropertyFilters(await searchParams);

  return (
    <PropertiesView
      filters={filters}
      heading="Search Results"
      emptyDescription="Try a different keyword or adjust your filters."
    />
  );
}
