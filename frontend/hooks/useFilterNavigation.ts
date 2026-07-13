"use client";

import { usePathname, useRouter } from "next/navigation";

/**
 * Builds a query string from a filters object and navigates the current path to it —
 * identical logic PropertiesView and DevelopersView each need to turn a filter update
 * or a pagination click into a URL. Generic over the filter shape so both can share it.
 */
export function useFilterNavigation<T extends object>() {
  const router = useRouter();
  const pathname = usePathname();

  return function updateParams(next: T) {
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
}
