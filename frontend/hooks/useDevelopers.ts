"use client";
import { useContentLocale as useLanguage } from "@/hooks/useContentLocale";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { developerService, type GetDevelopersParams } from "@/services";

export const DEVELOPERS_KEY = ["developers"] as const;

export function useDevelopers(params: GetDevelopersParams = {}) {
  const { language } = useLanguage();
  return useQuery({
    queryKey: [...DEVELOPERS_KEY, params, language],
    queryFn: () => developerService.getDevelopers(params),
    placeholderData: keepPreviousData,
  });
}
