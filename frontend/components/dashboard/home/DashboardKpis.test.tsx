import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { dashboardService } from "@/services";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";

import { DashboardKpis } from "./DashboardKpis";

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return {
    ...actual,
    dashboardService: { getMetrics: vi.fn() },
  };
});

const getMetrics = vi.mocked(dashboardService.getMetrics);

const metrics = {
  totalProperties: 6,
  activeListings: 2,
  draftListings: 2,
  appointmentRequests: 2,
  unreadNotifications: 3,
};

describe("DashboardKpis", () => {
  beforeEach(() => getMetrics.mockReset());

  it("renders the three portfolio-health KPI tiles once metrics resolve", async () => {
    getMetrics.mockResolvedValue(metrics);

    renderWithQueryClient(<DashboardKpis />);

    await waitFor(() =>
      expect(screen.getByText("Total Properties")).toBeInTheDocument(),
    );
    expect(screen.getByText("Active Listings")).toBeInTheDocument();
    expect(screen.getByText("Draft Listings")).toBeInTheDocument();
  });

  it("does not duplicate the time-sensitive counts DashboardActionNeeded now owns", async () => {
    getMetrics.mockResolvedValue(metrics);

    renderWithQueryClient(<DashboardKpis />);

    await waitFor(() =>
      expect(screen.getByText("Total Properties")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Appointment Requests")).not.toBeInTheDocument();
    expect(screen.queryByText("Unread Notifications")).not.toBeInTheDocument();
  });

  /**
   * Regression guard for the fabricated KPI removed in Stage 6: "Total Property
   * Views" was a hardcoded 3742 on the developer's first screen, while Analytics
   * next door refuses to make any view-based claim because no per-view data
   * exists (ADR-016). This asserts the tile stays gone *even when a value is
   * supplied* — so re-introducing it needs a deliberate change here, not just a
   * number reappearing in the service.
   */
  it("never renders a property-views tile, even if metrics carry a value", async () => {
    getMetrics.mockResolvedValue({ ...metrics, totalPropertyViews: 3742 });

    renderWithQueryClient(<DashboardKpis />);

    await waitFor(() =>
      expect(screen.getByText("Total Properties")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Total Property Views")).not.toBeInTheDocument();
    expect(screen.queryByText("3.7K")).not.toBeInTheDocument();
    expect(screen.queryByText("3742")).not.toBeInTheDocument();
  });

  // Error-state coverage lives in the full-page integration test
  // (test/integration/dashboard-home.test.tsx): a rejected React Query fetch in
  // an otherwise light component tree trips a node/vitest unhandled-rejection
  // false positive that a heavier render (the whole page) doesn't, matching how
  // the properties/developers domains test their error states at the view level.
});
