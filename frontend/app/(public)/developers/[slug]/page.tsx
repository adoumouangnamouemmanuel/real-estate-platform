import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeveloperProfileView } from "@/components/developer/DeveloperProfileView";
import { APP_NAME } from "@/constants/config";
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
      title: `${developer.name} | ${APP_NAME}`,
      description: developer.bio,
    };
  } catch {
    return { title: `Developer not found | ${APP_NAME}` };
  }
}

export default async function DeveloperProfilePage({
  params,
}: DeveloperProfilePageProps) {
  const { slug } = await params;

  const developer = await developerService
    .getDeveloperBySlug(slug)
    .catch(() => notFound());

  const activeListingsResult = await developerService.getDeveloperListings(
    developer.id,
  );

  return (
    <DeveloperProfileView
      developer={developer}
      activeListings={activeListingsResult.items}
    />
  );
}
