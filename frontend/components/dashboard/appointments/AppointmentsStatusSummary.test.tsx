import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { appointmentService } from "@/services";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";

import { AppointmentsStatusSummary } from "./AppointmentsStatusSummary";

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return { ...actual, appointmentService: { getStatusCounts: vi.fn() } };
});

const getStatusCounts = vi.mocked(appointmentService.getStatusCounts);

const counts = {
  REQUESTED: 4,
  CONFIRMED: 5,
  RESCHEDULED: 1,
  COMPLETED: 2,
  CANCELLED: 1,
  NO_SHOW: 1,
};

describe("AppointmentsStatusSummary", () => {
  beforeEach(() => getStatusCounts.mockReset());

  it("renders a count chip per status once counts resolve", async () => {
    getStatusCounts.mockResolvedValue(counts);

    renderWithQueryClient(
      <AppointmentsStatusSummary
        activeStatus={undefined}
        onSelectStatus={vi.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByText("4")).toBeInTheDocument());
    expect(screen.getByText("Requested")).toBeInTheDocument();
    expect(screen.getByText("No Show")).toBeInTheDocument();
  });

  it("selects a status when its chip is clicked", async () => {
    const user = userEvent.setup();
    const onSelectStatus = vi.fn();
    getStatusCounts.mockResolvedValue(counts);

    renderWithQueryClient(
      <AppointmentsStatusSummary
        activeStatus={undefined}
        onSelectStatus={onSelectStatus}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Confirmed")).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: /Confirmed/ }));
    expect(onSelectStatus).toHaveBeenCalledWith("CONFIRMED");
  });

  it("clears the active status on a second click", async () => {
    const user = userEvent.setup();
    const onSelectStatus = vi.fn();
    getStatusCounts.mockResolvedValue(counts);

    renderWithQueryClient(
      <AppointmentsStatusSummary
        activeStatus="CONFIRMED"
        onSelectStatus={onSelectStatus}
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Confirmed/ })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );

    await user.click(screen.getByRole("button", { name: /Confirmed/ }));
    expect(onSelectStatus).toHaveBeenCalledWith(undefined);
  });
});
