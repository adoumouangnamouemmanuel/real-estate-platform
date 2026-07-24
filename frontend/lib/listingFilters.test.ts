import { describe, expect, it } from "vitest";

import { buildListingFilterChips, parseListingFilters } from "./listingFilters";

describe("parseListingFilters", () => {
  it("defaults page to 1 and pageSize to 10", () => {
    expect(parseListingFilters({})).toMatchObject({ page: 1, pageSize: 10 });
  });

  it("clamps an invalid page to 1", () => {
    expect(parseListingFilters({ page: "-5" })).toMatchObject({ page: 1 });
    expect(parseListingFilters({ page: "not-a-number" })).toMatchObject({
      page: 1,
    });
  });

  it("only accepts an allow-listed page size", () => {
    expect(parseListingFilters({ pageSize: "25" })).toMatchObject({
      pageSize: 25,
    });
    expect(parseListingFilters({ pageSize: "999" })).toMatchObject({
      pageSize: 10,
    });
  });

  it("passes through a valid status, category, listing type, and sort", () => {
    expect(
      parseListingFilters({
        status: "DRAFT",
        category: "apartment",
        listingType: "RENT",
        sort: "price_asc",
      }),
    ).toMatchObject({
      status: "DRAFT",
      category: "apartment",
      listingType: "RENT",
      sort: "price_asc",
    });
  });

  it("drops an invalid status, category, listing type, or sort", () => {
    expect(
      parseListingFilters({
        status: "NOT_A_STATUS",
        category: "not-a-category",
        listingType: "LEASE",
        sort: "not-a-sort",
      }),
    ).toMatchObject({
      status: undefined,
      category: undefined,
      listingType: undefined,
      sort: undefined,
    });
  });

  it("trims an empty keyword to undefined", () => {
    expect(parseListingFilters({ q: "" })).toMatchObject({ q: undefined });
  });
});

describe("buildListingFilterChips", () => {
  it("builds a chip for each active filter", () => {
    const chips = buildListingFilterChips({
      q: "east legon",
      status: "DRAFT",
      category: "apartment",
      listingType: "RENT",
    });

    expect(chips).toEqual([
      { key: "q", label: '"east legon"' },
      { key: "status", label: "Draft" },
      { key: "category", label: "Apartments" },
      { key: "listingType", label: "For Rent" },
    ]);
  });

  it("returns no chips when nothing is filtered", () => {
    expect(buildListingFilterChips({})).toEqual([]);
  });
});
