import { describe, expect, it } from "vitest";

import { featureService, getFeatureByName } from "./feature.service";

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
});

describe("getFeatureByName", () => {
  it("finds a feature by its display name", () => {
    expect(getFeatureByName("Parking")?.iconName).toBe("Car");
  });

  it("returns undefined for an unknown name", () => {
    expect(getFeatureByName("Not A Real Feature")).toBeUndefined();
  });
});
