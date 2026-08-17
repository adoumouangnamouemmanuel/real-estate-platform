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

  return (
    <div className="flex flex-1 flex-col">
      {/*
        Server-rendered: this intro has no data dependency, so it stays out of
        the client bundle — only the filter/grid/pagination below needs
        interactivity. Deliberately no GlassSurface (there is no imagery here
        for it to sit over) and no decorative graphics; the hierarchy comes from
        type scale and whitespace.

        Every claim is checkable against the data model: each Property carries a
        required `developer`, and each developer record holds a bio, a city and
        region, and an active-listing count. Nothing here asserts that
        developers are screened, verified, or ranked — one of the three seeded
        developers is unverified.
      */}
      <header className="border-border border-b">
        <div className="container-page flex flex-col gap-3 py-12 sm:py-16">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Directory
          </p>
          <h1 className="font-heading max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            The developers behind every Lumavok listing
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Every property on Lumavok is listed by a named developer. Browse who
            they are, where they build, and what they currently have available.
          </p>
        </div>
      </header>

      <DevelopersView filters={filters} />
    </div>
  );
}
