"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { propertyService, type GetPropertiesParams } from "@/services";

/** Keeps the previous page's data visible while the next page loads, instead of flashing skeletons on every click. */
export function useProperties(params: GetPropertiesParams = {}) {
  return useQuery({
    queryKey: ["properties", params],
    queryFn: () => propertyService.getProperties(params),
    placeholderData: keepPreviousData,
  });
}
