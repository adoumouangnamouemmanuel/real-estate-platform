import "server-only";
import { cookies } from "next/headers";
import type {
  Property,
  PropertyDetail,
  DeveloperProfile,
  PaginatedResult,
  ApiResponse,
} from "@/types";
import { rankSimilarProperties } from "@/lib/similarProperties";
async function read<T>(path: string): Promise<T> {
  const language =
    (await cookies()).get("lumavok-language")?.value === "en" ? "en" : "fr";
  const origin = process.env.BACKEND_API_URL ?? "http://localhost:4000";
  const url = new URL(origin + "/api/v1" + path);
  url.searchParams.set("lang", language);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Catalogue unavailable");
  return ((await response.json()) as ApiResponse<T>).data;
}
export const serverPropertyService = {
  getProperties: ({ pageSize = 12 }: { pageSize?: number } = {}) =>
    read<PaginatedResult<Property>>("/properties?pageSize=" + pageSize),
  getPropertyBySlug: (slug: string) =>
    read<PropertyDetail>("/properties/" + encodeURIComponent(slug)),
  getRelatedProperties: async (property: Property, limit = 4) =>
    rankSimilarProperties(
      property,
      await read<Property[]>(
        `/properties/${encodeURIComponent(property.id)}/related?limit=${limit}`,
      ),
      limit,
    ),
};
export const serverDeveloperService = {
  getDeveloperBySlug: (slug: string) =>
    read<DeveloperProfile>("/developers/" + encodeURIComponent(slug)),
  getDeveloperListings: (id: string) =>
    read<PaginatedResult<Property>>(
      `/developers/${encodeURIComponent(id)}/listings`,
    ),
};
