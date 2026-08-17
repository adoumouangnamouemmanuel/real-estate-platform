import { describe, expect, it } from "vitest";

import {
  buildPropertyLocationLines,
  formatPropertyLocation,
} from "./propertyLocation";

describe("formatPropertyLocation", () => {
  it("prefers district over region when the listing has one", () => {
    expect(
      formatPropertyLocation({
        city: "Accra",
        region: "Greater Accra",
        district: "East Legon",
      }),
    ).toBe("East Legon, Accra");
  });

  it("falls back to city and region when there is no district", () => {
    // Every mock record today is in this state — district exists on the model
    // and is collected by the editor, but fixtures were never backfilled (see
    // frontend/TODO.md, Phase 0.5). Formatting must be unchanged for them.
    expect(formatPropertyLocation({ city: "Kumasi", region: "Ashanti" })).toBe(
      "Kumasi, Ashanti",
    );
  });

  it("treats an empty-string district as absent rather than rendering a stray comma", () => {
    expect(
      formatPropertyLocation({
        city: "Tema",
        region: "Greater Accra",
        district: "",
      }),
    ).toBe("Tema, Greater Accra");
  });
});

describe("buildPropertyLocationLines", () => {
  it("stacks the place hierarchy most-specific first", () => {
    expect(
      buildPropertyLocationLines({
        address: "12 Boundary Road",
        district: "East Legon",
        city: "Accra",
        region: "Greater Accra",
      }),
    ).toEqual(["12 Boundary Road", "East Legon", "Accra", "Greater Accra"]);
  });

  it("drops parts the listing doesn't have instead of leaving gaps", () => {
    expect(
      buildPropertyLocationLines({
        address: "12 Boundary Road",
        city: "Accra",
        region: "Greater Accra",
      }),
    ).toEqual(["12 Boundary Road", "Accra", "Greater Accra"]);
  });
});
