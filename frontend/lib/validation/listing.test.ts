import { describe, expect, it } from "vitest";

import {
  listingSchema,
  publishListingSchema,
  validateForPublish,
  type ListingFormValues,
} from "./listing";

function makeValues(
  overrides: Partial<ListingFormValues> = {},
): ListingFormValues {
  return {
    title: "A Listing",
    description: "",
    price: undefined,
    listingType: undefined,
    category: undefined,
    city: "",
    region: "",
    address: "",
    amenities: [],
    media: [],
    ...overrides,
  };
}

describe("listingSchema (draft profile)", () => {
  it("accepts a barely-filled draft — only title is required", () => {
    const result = listingSchema.safeParse(makeValues());
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = listingSchema.safeParse(makeValues({ title: "" }));
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive price when one is provided", () => {
    const result = listingSchema.safeParse(makeValues({ price: 0 }));
    expect(result.success).toBe(false);
  });
});

describe("publishListingSchema — a superset of listingSchema, not a parallel schema", () => {
  it("every publish-profile field also exists on the base schema", () => {
    const baseKeys = Object.keys(listingSchema.shape);
    const publishKeys = Object.keys(publishListingSchema.shape);
    expect(publishKeys.sort()).toEqual(baseKeys.sort());
  });

  it("rejects a listing missing the publish-required fields", () => {
    const result = publishListingSchema.safeParse(makeValues());
    expect(result.success).toBe(false);
  });

  it("accepts a fully-filled listing", () => {
    const result = publishListingSchema.safeParse(
      makeValues({
        description: "A lovely place.",
        price: 100000,
        listingType: "SALE",
        category: "apartment",
        city: "Accra",
        region: "Greater Accra",
        address: "1 Main Street",
        media: [{ url: "https://example.com/a.jpg", publicId: "a", order: 0 }],
      }),
    );
    expect(result.success).toBe(true);
  });
});

describe("validateForPublish", () => {
  it("returns a flat, human-readable error list for an incomplete draft", () => {
    const result = validateForPublish(makeValues());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(
        result.errors.some((issue) => issue.message.includes("photo")),
      ).toBe(true);
    }
  });

  it("succeeds for a complete listing", () => {
    const result = validateForPublish(
      makeValues({
        description: "A lovely place.",
        price: 100000,
        listingType: "SALE",
        category: "apartment",
        city: "Accra",
        region: "Greater Accra",
        address: "1 Main Street",
        media: [{ url: "https://example.com/a.jpg", publicId: "a", order: 0 }],
      }),
    );
    expect(result.success).toBe(true);
  });
});
