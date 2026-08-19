import type { Metadata } from "next";

import { PropertiesView } from "@/components/property/PropertiesView";
import { APP_NAME } from "@/constants/config";
import {
  parsePropertyFilters,
  type RawPropertySearchParams,
} from "@/lib/propertyFilters";

export const metadata: Metadata = {
  title: `Search | ${APP_NAME}`,
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
      eyebrow="Search"
      heading="Search Results"
      // No lede: on a results page the count and the active filter chips are
      // the orientation. Anything else here would be filler.
      emptyDescription="Try a different keyword or adjust your filters."
    />
  );
}
