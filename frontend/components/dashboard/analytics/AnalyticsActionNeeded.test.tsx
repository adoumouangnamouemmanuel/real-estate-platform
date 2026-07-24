import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ActionNeededItem } from "@/types";

import { AnalyticsActionNeeded } from "./AnalyticsActionNeeded";

const overdueItem: ActionNeededItem = {
  type: "OVERDUE_APPOINTMENTS",
  severity: "high",
  title: "3 overdue appointment requests",
  description: "These viewing requests are past their scheduled date.",
  count: 3,
  href: "/appointments?timeframe=overdue",
};

const staleItem: ActionNeededItem = {
  type: "STALE_DRAFTS",
  severity: "medium",
  title: "2 stale drafts",
  description: "No activity in 5+ days.",
  count: 2,
  href: "/listings?status=DRAFT",
};

describe("AnalyticsActionNeeded", () => {
  it("shows a loading skeleton", () => {
    render(<AnalyticsActionNeeded items={[]} isLoading />);
    expect(screen.getByText("Action Needed")).toBeInTheDocument();
  });

  it("shows the caught-up empty state when nothing needs attention", () => {
    render(<AnalyticsActionNeeded items={[]} isLoading={false} />);
    expect(
      screen.getByText("Nothing needs your attention"),
    ).toBeInTheDocument();
  });

  it("renders each item's title, description, severity badge, and deep link", () => {
    render(
      <AnalyticsActionNeeded items={[overdueItem, staleItem]} isLoading={false} />,
    );

    expect(screen.getByText("3 overdue appointment requests")).toBeInTheDocument();
    expect(
      screen.getByText("These viewing requests are past their scheduled date."),
    ).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();

    const links = screen.getAllByRole("link", { name: "View" });
    expect(links[0]).toHaveAttribute("href", "/appointments?timeframe=overdue");
    expect(links[1]).toHaveAttribute("href", "/listings?status=DRAFT");
  });
});
