import type { Metadata } from "next";

import { PageHeader } from "@/components/common/PageHeader";
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

  return (
    <div className="flex flex-1 flex-col">
      {/*
        Server-rendered: this intro has no data dependency, so it stays out of
        the client bundle — only the filter/grid/pagination below needs
        interactivity.

        Every claim is checkable against the data model: each Property carries a
        required `developer`, and each developer record holds a bio, a city and
        region, and an active-listing count. Nothing here asserts that
        developers are screened, verified, or ranked — one of the three seeded
        developers is unverified.
      */}
      <PageHeader
        eyebrow="Directory"
        title="The developers behind every Lumavok listing"
        lede="Every property on Lumavok is listed by a named developer. Browse who they are, where they build, and what they currently have available."
      />

      <DevelopersView filters={filters} />
    </div>
  );
}
