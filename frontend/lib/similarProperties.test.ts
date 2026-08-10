import { describe, expect, it } from "vitest";

import { rankSimilarProperties } from "./similarProperties";
import type { Property } from "@/types";

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: "id",
    slug: "slug",
    title: "Title",
    description: "",
    price: 100_000,
    listingType: "SALE",
    category: "house",
    city: "Accra",
    region: "Greater Accra",
    status: "ACTIVE",
    media: [],
    ...overrides,
  };
}

describe("rankSimilarProperties", () => {
  it("ranks a candidate matching city, price range, and bedrooms above a candidate matching nothing extra", () => {
    const source = makeProperty({
      id: "source",
      city: "Accra",
      district: "Osu",
      price: 100_000,
      bedrooms: 3,
    });
    const strongMatch = makeProperty({
      id: "strong",
      city: "Accra",
      district: "Osu",
      price: 105_000,
      bedrooms: 3,
    });
    const weakMatch = makeProperty({
      id: "weak",
      city: "Kumasi",
      price: 900_000,
      bedrooms: 5,
    });

    const [first, second] = rankSimilarProperties(
      source,
      [weakMatch, strongMatch],
      2,
    );

    expect(first.id).toBe("strong");
    expect(second.id).toBe("weak");
  });

  it("builds an explanation string only from signals that actually matched", () => {
    const source = makeProperty({ city: "Accra", district: "Osu" });
    const candidate = makeProperty({
      id: "candidate",
      city: "Accra",
      district: "Osu",
    });

    const [result] = rankSimilarProperties(source, [candidate], 1);

    expect(result.reason).toContain("in Accra");
    expect(result.reason).toContain("in the Osu area");
  });

  it("falls back to a category-only explanation when no other signal matched", () => {
    const source = makeProperty({ city: "Accra", price: 100_000 });
    const candidate = makeProperty({
      id: "candidate",
      city: "Kumasi",
      price: 5_000_000,
    });

    const [result] = rankSimilarProperties(source, [candidate], 1);

    expect(result.reason).toBe(
      "Similar because it's also listed under Houses.",
    );
  });

  it("never scores bedrooms for Land candidates, and compares land size instead of building size", () => {
    const source = makeProperty({
      category: "land",
      landSizeSqm: 500,
      bedrooms: undefined,
    });
    const candidate = makeProperty({
      id: "candidate",
      category: "land",
      landSizeSqm: 520,
    });

    const [result] = rankSimilarProperties(source, [candidate], 1);

    expect(result.reason).toContain("a similar size");
  });

  it("respects the limit", () => {
    const source = makeProperty();
    const candidates = Array.from({ length: 10 }, (_, i) =>
      makeProperty({ id: `c${i}` }),
    );

    expect(rankSimilarProperties(source, candidates, 4)).toHaveLength(4);
  });
});
