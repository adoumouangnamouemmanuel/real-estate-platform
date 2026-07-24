import { describe, expect, it } from "vitest";

import { analyticsService } from "./analytics.service";
import { MOCK_LISTINGS } from "./mocks/listings.mock";

describe("analyticsService.getSnapshot", () => {
  it("returns a snapshot for the requested period, sourced from the real listing/appointment mocks", async () => {
    const snapshot = await analyticsService.getSnapshot("30d");

    expect(snapshot.period).toBe("30d");
    expect(snapshot.generatedAt).toBeTruthy();
    expect(snapshot.portfolio.totalListings).toBe(MOCK_LISTINGS.length);
    expect(Array.isArray(snapshot.stats)).toBe(true);
    expect(Array.isArray(snapshot.actionNeeded)).toBe(true);
    expect(snapshot.funnel.period).toBe("30d");
  });

  it("defaults to a 30-day period when none is given", async () => {
    const snapshot = await analyticsService.getSnapshot();
    expect(snapshot.period).toBe("30d");
  });

  it("passes the requested period through to the funnel calculation", async () => {
    const snapshot = await analyticsService.getSnapshot("7d");
    expect(snapshot.funnel.period).toBe("7d");
  });
});
