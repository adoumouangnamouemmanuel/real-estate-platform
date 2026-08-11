import { describe, expect, it } from "vitest";

import {
  featureService,
  getFeatureByName,
  getFeatureNamesForCategory,
} from "./feature.service";

describe("featureService", () => {
  it("returns the full catalog when no category is given", async () => {
    const features = await featureService.getFeatures();
    expect(features.length).toBeGreaterThan(0);
  });

  it("filters to only features offered for the given category", async () => {
    const features = await featureService.getFeatures("land");
    expect(features.every((f) => f.propertyCategories.includes("land"))).toBe(
      true,
    );
    expect(features.some((f) => f.name === "Registered Title")).toBe(true);
    expect(features.some((f) => f.name === "Fitted Kitchen")).toBe(false);
  });

  it("offers 24/7 Security for office listings (parity with the retired AMENITY_POOLS.office pool)", async () => {
    const features = await featureService.getFeatures("office");
    expect(features.some((f) => f.name === "24/7 Security")).toBe(true);
  });
});

describe("getFeatureByName", () => {
  it("finds a feature by its display name", () => {
    expect(getFeatureByName("Parking")?.iconName).toBe("Car");
  });

  it("returns undefined for an unknown name", () => {
    expect(getFeatureByName("Not A Real Feature")).toBeUndefined();
  });
});

describe("getFeatureNamesForCategory", () => {
  it("returns only names of features offered for that category", () => {
    const names = getFeatureNamesForCategory("land");
    expect(names).toContain("Registered Title");
    expect(names).not.toContain("Fitted Kitchen");
  });

  it("matches featureService.getFeatures' names exactly for the same category", async () => {
    const names = getFeatureNamesForCategory("apartment");
    const features = await featureService.getFeatures("apartment");
    expect(names).toEqual(features.map((f) => f.name));
  });
});
