import { describe, expect, it } from "vitest";

import {
  buildPropertyFilterChips,
  hasMixedPriceComparison,
  parsePropertyFilters,
} from "./propertyFilters";

describe("parsePropertyFilters — listingType", () => {
  it("parses a valid listing type off the URL", () => {
    expect(parsePropertyFilters({ listingType: "RENT" }).listingType).toBe(
      "RENT",
    );
  });

  it("ignores an unknown value rather than passing it through to the service", () => {
    expect(
      parsePropertyFilters({ listingType: "LEASE" }).listingType,
    ).toBeUndefined();
  });

  it("leaves listingType undefined when absent, so both types are shown", () => {
    expect(parsePropertyFilters({}).listingType).toBeUndefined();
  });
});

describe("buildPropertyFilterChips — listingType", () => {
  it("renders the chip with the same wording the property badge uses", () => {
    const chips = buildPropertyFilterChips({ listingType: "SALE" });
    expect(chips).toContainEqual({ key: "listingType", label: "For Sale" });
  });

  it("adds no chip when the filter isn't active", () => {
    expect(
      buildPropertyFilterChips({ city: "Accra" }).map((chip) => chip.key),
    ).not.toContain("listingType");
  });
});

/**
 * A sale price and a monthly rent aren't the same unit, so ordering a mixed
 * list by price ranks them against each other meaninglessly — before the
 * Sale/Rent filter existed, "Price: Low to High" put six rentals ahead of every
 * sale listing. The note this drives is the honest alternative to inventing a
 * normalization the data model can't support.
 */
describe("hasMixedPriceComparison", () => {
  it("is true when sorting by price with both types in the list", () => {
    expect(hasMixedPriceComparison({ sort: "price_asc" })).toBe(true);
    expect(hasMixedPriceComparison({ sort: "price_desc" })).toBe(true);
  });

  it("is false once the list is narrowed to one listing type", () => {
    expect(
      hasMixedPriceComparison({ sort: "price_asc", listingType: "RENT" }),
    ).toBe(false);
  });

  it("is false when not sorting by price at all", () => {
    expect(hasMixedPriceComparison({ sort: "newest" })).toBe(false);
    expect(hasMixedPriceComparison({})).toBe(false);
  });
});
