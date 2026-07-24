import { describe, expect, it } from "vitest";

import { parseAnalyticsPeriod } from "./analyticsFilters";

describe("parseAnalyticsPeriod", () => {
  it("defaults to 30d when no period is given", () => {
    expect(parseAnalyticsPeriod({})).toBe("30d");
  });

  it("passes through a valid period", () => {
    expect(parseAnalyticsPeriod({ period: "7d" })).toBe("7d");
    expect(parseAnalyticsPeriod({ period: "90d" })).toBe("90d");
  });

  it("falls back to the default for an invalid period", () => {
    expect(parseAnalyticsPeriod({ period: "1y" })).toBe("30d");
  });
});
