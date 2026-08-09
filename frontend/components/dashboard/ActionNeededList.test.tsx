import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ActionNeededItem } from "@/types";

import { ActionNeededList } from "./ActionNeededList";

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

const newRequestItem: ActionNeededItem = {
  type: "NEW_APPOINTMENT_REQUESTS",
  severity: "medium",
  title: "2 new appointment requests",
  description: "Confirm or decline these viewing requests.",
  count: 2,
  href: "/appointments?status=REQUESTED",
};

const suspendedItem: ActionNeededItem = {
  type: "SUSPENDED_LISTINGS",
  severity: "medium",
  title: "1 suspended listing",
  description: "Suspended listings aren't visible to buyers.",
  count: 1,
  href: "/listings?status=SUSPENDED",
};

describe("ActionNeededList", () => {
  it("shows a loading skeleton", () => {
    render(<ActionNeededList items={[]} isLoading />);
    expect(screen.getByText("Action Needed")).toBeInTheDocument();
  });

  it("shows the caught-up empty state when nothing needs attention", () => {
    render(<ActionNeededList items={[]} isLoading={false} />);
    expect(
      screen.getByText("Nothing needs your attention"),
    ).toBeInTheDocument();
  });

  it("supports custom title/description/empty copy for a non-Analytics caller", () => {
    render(
      <ActionNeededList
        items={[]}
        isLoading={false}
        emptyDescription="You're caught up on appointments and drafts."
      />,
    );
    expect(
      screen.getByText("You're caught up on appointments and drafts."),
    ).toBeInTheDocument();
  });

  it("renders each item's title, description, severity badge, and deep link", () => {
    render(
      <ActionNeededList items={[overdueItem, staleItem]} isLoading={false} />,
    );

    expect(
      screen.getByText("3 overdue appointment requests"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("These viewing requests are past their scheduled date."),
    ).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();

    const links = screen.getAllByRole("link", { name: "View" });
    expect(links[0]).toHaveAttribute("href", "/appointments?timeframe=overdue");
    expect(links[1]).toHaveAttribute("href", "/listings?status=DRAFT");
  });

  it("renders Dashboard Home's own item types (new requests, suspended listings)", () => {
    render(
      <ActionNeededList
        items={[newRequestItem, suspendedItem]}
        isLoading={false}
      />,
    );

    expect(screen.getByText("2 new appointment requests")).toBeInTheDocument();
    expect(screen.getByText("1 suspended listing")).toBeInTheDocument();
  });
});
