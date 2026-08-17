import { describe, expect, it } from "vitest";

import { propertyService } from "./property.service";
import { MOCK_PROPERTIES } from "./mocks/properties.mock";

describe("propertyService.getProperties — listingType filter", () => {
  it("returns only sale listings when filtered to SALE", async () => {
    const result = await propertyService.getProperties({
      listingType: "SALE",
      pageSize: 100,
    });

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((item) => item.listingType === "SALE")).toBe(
      true,
    );
  });

  it("returns only rentals when filtered to RENT", async () => {
    const result = await propertyService.getProperties({
      listingType: "RENT",
      pageSize: 100,
    });

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((item) => item.listingType === "RENT")).toBe(
      true,
    );
  });

  it("returns both types when unfiltered, and the two partitions sum to the whole catalogue", async () => {
    const [all, sale, rent] = await Promise.all([
      propertyService.getProperties({ pageSize: 100 }),
      propertyService.getProperties({ listingType: "SALE", pageSize: 100 }),
      propertyService.getProperties({ listingType: "RENT", pageSize: 100 }),
    ]);

    expect(sale.total + rent.total).toBe(all.total);
  });

  it("composes with other filters rather than replacing them", async () => {
    const result = await propertyService.getProperties({
      listingType: "SALE",
      city: "Accra",
      pageSize: 100,
    });

    expect(
      result.items.every(
        (item) => item.listingType === "SALE" && item.city === "Accra",
      ),
    ).toBe(true);
  });
});

describe("propertyService.getPropertiesByIds", () => {
  it("resolves ids in the order given", async () => {
    const [first, second] = MOCK_PROPERTIES;
    const result = await propertyService.getPropertiesByIds([
      second.id,
      first.id,
    ]);

    expect(result.map((item) => item.id)).toEqual([second.id, first.id]);
  });

  it("silently drops ids with no matching property", async () => {
    // A browser's saved list can name a listing that has since been delisted;
    // it should quietly disappear from Saved Properties, not error the page.
    const result = await propertyService.getPropertiesByIds([
      MOCK_PROPERTIES[0].id,
      "does-not-exist",
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(MOCK_PROPERTIES[0].id);
  });

  it("returns an empty list for no ids", async () => {
    expect(await propertyService.getPropertiesByIds([])).toEqual([]);
  });
});
