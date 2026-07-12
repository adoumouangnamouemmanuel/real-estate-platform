import type { Metadata } from "next";

import { PropertiesView } from "@/components/property/PropertiesView";

export const metadata: Metadata = {
  title: "Properties | ByTe",
  description: "Browse verified property listings across African markets.",
};

interface PropertiesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function PropertiesPage({
  searchParams,
}: PropertiesPageProps) {
  const { page } = await searchParams;
  const pageNumber = Math.max(1, Number(page) || 1);

  return <PropertiesView page={pageNumber} />;
}
