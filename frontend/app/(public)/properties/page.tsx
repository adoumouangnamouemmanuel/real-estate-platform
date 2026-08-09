import type { Metadata } from "next";

import { PropertiesView } from "@/components/property/PropertiesView";
import { APP_NAME } from "@/constants/config";
import {
  parsePropertyFilters,
  type RawPropertySearchParams,
} from "@/lib/propertyFilters";

export const metadata: Metadata = {
  title: `Properties | ${APP_NAME}`,
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
