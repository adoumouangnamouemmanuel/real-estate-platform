import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { AppointmentFunnel } from "@/types";

import { AppointmentFunnelChart } from "./AppointmentFunnelChart";

const funnel: AppointmentFunnel = {
  period: "30d",
  stages: [
    { status: "REQUESTED", count: 2 },
    { status: "CONFIRMED", count: 3 },
    { status: "RESCHEDULED", count: 0 },
    { status: "COMPLETED", count: 4 },
    { status: "CANCELLED", count: 1 },
    { status: "NO_SHOW", count: 0 },
  ],
  totalRequested: 10,
  responseRate: 0.8,
  completionRate: 0.5,
  cancellationRate: 0.1,
  noShowRate: 0,
  averageResponseHours: 5,
};

const emptyFunnel: AppointmentFunnel = {
  ...funnel,
  stages: funnel.stages.map((stage) => ({ ...stage, count: 0 })),
  totalRequested: 0,
};

describe("AppointmentFunnelChart", () => {
  it("shows a loading skeleton", () => {
    render(<AppointmentFunnelChart funnel={undefined} isLoading />);
    expect(screen.getByText("Appointment Funnel")).toBeInTheDocument();
  });

  it("shows an empty state when nothing was requested in the period", () => {
    render(<AppointmentFunnelChart funnel={emptyFunnel} isLoading={false} />);
    expect(
      screen.getByText("No appointments requested this period"),
    ).toBeInTheDocument();
  });

  it("renders each stage's label and count in the chart view", () => {
    render(<AppointmentFunnelChart funnel={funnel} isLoading={false} />);

    expect(screen.getByText("Requested")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    // Stage counts appear as plain visible text next to each bar.
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("toggles to an equivalent, fully visible table with the same data", async () => {
    const user = userEvent.setup();
    render(<AppointmentFunnelChart funnel={funnel} isLoading={false} />);

    await user.click(screen.getByRole("button", { name: "View as table" }));

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Requested" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View as chart" }),
    ).toBeInTheDocument();
  });

  it("does not offer the table toggle when there's nothing to show", () => {
    render(<AppointmentFunnelChart funnel={emptyFunnel} isLoading={false} />);
    expect(
      screen.queryByRole("button", { name: "View as table" }),
    ).not.toBeInTheDocument();
  });
});
