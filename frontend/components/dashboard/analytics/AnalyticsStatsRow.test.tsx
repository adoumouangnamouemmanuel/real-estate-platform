import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AnalyticsStat } from "@/types";

import { AnalyticsStatsRow } from "./AnalyticsStatsRow";

const stats: AnalyticsStat[] = [
  {
    key: "active_listings",
    label: "Active Listings",
    value: 6,
    format: "number",
    hint: "8 total",
  },
  {
    key: "response_rate",
    label: "Response Rate",
    value: 75,
    format: "percent",
    hint: "4 requested this period",
  },
  {
    key: "completed_viewings",
    label: "Completed Viewings",
    value: 3,
    format: "number",
    trend: [0, 1, 0, 1, 0, 1, 0],
  },
];

describe("AnalyticsStatsRow", () => {
  it("renders a StatCard per stat with its label and formatted value", () => {
    render(<AnalyticsStatsRow stats={stats} isLoading={false} />);

    expect(screen.getByText("Active Listings")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("Response Rate")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("shows loading skeletons when isLoading", () => {
    const { container } = render(
      <AnalyticsStatsRow stats={[]} isLoading />,
    );
    expect(container.querySelectorAll("[data-slot='skeleton']").length).toBeGreaterThan(0);
  });
});
