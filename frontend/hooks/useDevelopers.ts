"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { developerService, type GetDevelopersParams } from "@/services";

export function useDevelopers(params: GetDevelopersParams = {}) {
  return useQuery({
    queryKey: ["developers", params],
    queryFn: () => developerService.getDevelopers(params),
    placeholderData: keepPreviousData,
  });
}
