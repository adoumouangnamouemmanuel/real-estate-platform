import type { Property } from "@/types";

/**
 * The one-line location label used on cards and the property detail header.
 *
 * Prefers the most specific place a buyer recognises. `district` is the finest
 * grain the model has (a city-scoped subdivision — "East Legon", not a region),
 * so when it's present it replaces `region` rather than being appended: "East
 * Legon, Accra" reads like an address, "East Legon, Accra, Greater Accra" reads
 * like a form. When there's no district, region is what keeps the city
 * unambiguous, so it stays.
 *
 * Never fabricates: a property with no district (every mock record today — see
 * frontend/TODO.md's Phase 0.5 note on fixtures not being backfilled) is
 * formatted exactly as it was before this existed.
 */
export function formatPropertyLocation(
  property: Pick<Property, "city" | "region" | "district">,
): string {
  if (property.district) return `${property.district}, ${property.city}`;
  return `${property.city}, ${property.region}`;
}

/**
 * The full place stack for the detail page's Location section, most specific
 * first, with empty parts dropped. Rendered as separate lines rather than one
 * comma-joined string so the hierarchy is visible (address → district → city →
 * region) instead of collapsing into a run-on.
 */
export function buildPropertyLocationLines(
  property: Pick<Property, "city" | "region" | "district" | "address">,
): string[] {
  return [
    property.address,
    property.district,
    property.city,
    property.region,
  ].filter((part): part is string => Boolean(part));
}
