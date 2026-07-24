"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { developerService, type GetDevelopersParams } from "@/services";

export const DEVELOPERS_KEY = ["developers"] as const;

export function useDevelopers(params: GetDevelopersParams = {}) {
  return useQuery({
    queryKey: [...DEVELOPERS_KEY, params],
    queryFn: () => developerService.getDevelopers(params),
    placeholderData: keepPreviousData,
  });
}
