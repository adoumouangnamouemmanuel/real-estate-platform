"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiResponse } from "@/types";
export interface LocationCity {
  id: string;
  name: string;
  countryCode: string;
  districts: { id: string; name: string; cityId: string }[];
}
export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: () =>
      api
        .get<ApiResponse<LocationCity[]>>("/locations")
        .then((r) => r.data.data),
    staleTime: 300000,
  });
}
