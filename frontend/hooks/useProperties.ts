"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { propertyService, type GetPropertiesParams } from "@/services";

export const PROPERTIES_KEY = ["properties"] as const;

/** Keeps the previous page's data visible while the next page loads, instead of flashing skeletons on every click. */
export function useProperties(params: GetPropertiesParams = {}) {
  return useQuery({
    queryKey: [...PROPERTIES_KEY, params],
    queryFn: () => propertyService.getProperties(params),
    placeholderData: keepPreviousData,
  });
}
