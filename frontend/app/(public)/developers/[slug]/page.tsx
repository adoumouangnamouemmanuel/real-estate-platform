import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeveloperProfileView } from "@/components/developer/DeveloperProfileView";
import { developerService } from "@/services";

interface DeveloperProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: DeveloperProfilePageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const developer = await developerService.getDeveloperBySlug(slug);
    return {
      title: `${developer.name} | ByTe`,
      description: developer.bio,
    };
  } catch {
    return { title: "Developer not found | ByTe" };
  }
}

export default async function DeveloperProfilePage({
  params,
}: DeveloperProfilePageProps) {
  const { slug } = await params;

  const developer = await developerService
    .getDeveloperBySlug(slug)
    .catch(() => notFound());

  const [activeListingsResult, featuredListings] = await Promise.all([
    developerService.getDeveloperListings(developer.id),
    developerService.getFeaturedListings(developer.id, 3),
  ]);

  return (
    <DeveloperProfileView
      developer={developer}
      activeListings={activeListingsResult.items}
      featuredListings={featuredListings}
    />
  );
}
