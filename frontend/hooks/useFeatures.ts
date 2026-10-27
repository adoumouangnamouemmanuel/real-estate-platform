"use client";
import { useContentLocale as useLanguage } from "@/hooks/useContentLocale";

import { useQuery } from "@tanstack/react-query";

import type { PropertyCategory } from "@/constants/categories";
import { featureService } from "@/services";

export const FEATURES_KEY = ["features"] as const;

/** The full feature catalog, optionally filtered to what's offered for one property category. */
export function useFeatures(category?: PropertyCategory) {
  const { language } = useLanguage();
  return useQuery({
    queryKey: [...FEATURES_KEY, category ?? "all", language],
    queryFn: () => featureService.getFeatures(category),
  });
}
