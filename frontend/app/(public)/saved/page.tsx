import type { Metadata } from "next";

import { SavedPropertiesView } from "@/components/property/SavedPropertiesView";
import { APP_NAME } from "@/constants/config";

export const metadata: Metadata = {
  title: `Saved Properties | ${APP_NAME}`,
  description: "The property listings you've saved.",
};

/**
 * No `searchParams`, unlike /properties and /search: this list isn't filtered or
 * paginated — it's whatever this browser has saved, which is a short list by
 * nature. Kept a Server Component wrapper for metadata only; the view is a
 * Client Component because favourites live in localStorage.
 */
export default function SavedPropertiesPage() {
  return <SavedPropertiesView />;
}
