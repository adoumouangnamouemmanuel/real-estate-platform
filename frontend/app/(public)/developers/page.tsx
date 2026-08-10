import type { Metadata } from "next";

import { DevelopersView } from "@/components/developer/DevelopersView";
import { APP_NAME } from "@/constants/config";
import {
  parseDeveloperFilters,
  type RawDeveloperSearchParams,
} from "@/lib/developerFilters";

export const metadata: Metadata = {
  title: `Developers | ${APP_NAME}`,
  description: "Browse property developers across African markets.",
};

interface DevelopersPageProps {
  searchParams: Promise<RawDeveloperSearchParams>;
}

export default async function DevelopersPage({
  searchParams,
}: DevelopersPageProps) {
  const filters = parseDeveloperFilters(await searchParams);

  return <DevelopersView filters={filters} />;
}
