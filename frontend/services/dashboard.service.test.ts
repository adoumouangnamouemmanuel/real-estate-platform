import { describe, expect, it } from "vitest";

import { dashboardService } from "./dashboard.service";

describe("dashboardService.getMetrics", () => {
  it("derives every metric it returns from the mock data", async () => {
    const metrics = await dashboardService.getMetrics();

    expect(metrics.totalProperties).toBeGreaterThan(0);
    expect(metrics.activeListings).toBeLessThanOrEqual(metrics.totalProperties);
    expect(metrics.draftListings).toBeLessThanOrEqual(metrics.totalProperties);
  });

  /**
   * Regression guard for Stage 6: `totalPropertyViews` was a hardcoded 3742
   * with no data behind it — the one fabricated number on the dashboard, and
   * exactly the claim Analytics refuses to make for want of per-view data
   * (ADR-016). It must stay absent until a real source exists
   * (`property_analytics`, ARCHITECTURE.md §11) rather than be replaced with
   * another constant or a placeholder zero.
   */
  it("omits totalPropertyViews entirely — no invented value, not even zero", async () => {
    const metrics = await dashboardService.getMetrics();

    expect(metrics.totalPropertyViews).toBeUndefined();
    expect("totalPropertyViews" in metrics).toBe(false);
  });
});
