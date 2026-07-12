import type { FilterChip } from "@/components/common/FilterChips";
import type { DeveloperSort, GetDevelopersParams } from "@/services";

export type RawDeveloperSearchParams = Record<
  string,
  string | string[] | undefined
>;

const SORT_VALUES: DeveloperSort[] = [
  "rating_desc",
  "name_asc",
  "listings_desc",
];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** The one place /developers parses the URL into typed filters. */
export function parseDeveloperFilters(
  raw: RawDeveloperSearchParams,
): GetDevelopersParams {
  const sort = first(raw.sort) as DeveloperSort | undefined;

  return {
    page: Math.max(1, Number(first(raw.page)) || 1),
    q: first(raw.q) || undefined,
    city: first(raw.city) || undefined,
    sort: sort && SORT_VALUES.includes(sort) ? sort : undefined,
  };
}

export function buildDeveloperFilterChips(
  filters: GetDevelopersParams,
): FilterChip<keyof GetDevelopersParams>[] {
  const chips: FilterChip<keyof GetDevelopersParams>[] = [];

  if (filters.q) chips.push({ key: "q", label: `"${filters.q}"` });
  if (filters.city) chips.push({ key: "city", label: filters.city });

  return chips;
}
