import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { dashboardService } from "@/services";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";
import type { Appointment } from "@/types";

import { AppointmentOverview } from "./AppointmentOverview";

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return {
    ...actual,
    dashboardService: { getAppointmentOverview: vi.fn() },
  };
});

const getAppointmentOverview = vi.mocked(
  dashboardService.getAppointmentOverview,
);

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: "a1",
    propertyId: "dl1",
    propertyTitle: "Luxury 3BR Apartment",
    clientName: "Adjoa Sarpong",
    scheduledFor: "2026-07-24T10:00:00.000Z",
    status: "CONFIRMED",
    ...overrides,
  };
}

describe("AppointmentOverview", () => {
  beforeEach(() => getAppointmentOverview.mockReset());

  it("shows upcoming appointments by default and switches tabs", async () => {
    const user = userEvent.setup();
    getAppointmentOverview.mockResolvedValue({
      upcoming: [
        makeAppointment({ id: "a1", propertyTitle: "Upcoming Villa" }),
      ],
      requested: [
        makeAppointment({
          id: "a2",
          propertyTitle: "Requested Office",
          status: "REQUESTED",
        }),
      ],
      completed: [],
    });

    renderWithQueryClient(<AppointmentOverview />);

    await waitFor(() =>
      expect(screen.getByText("Upcoming Villa")).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("tab", { name: /Requested/ }));
    expect(screen.getByText("Requested Office")).toBeInTheDocument();
  });

  it("shows a per-tab empty state when a bucket is empty", async () => {
    const user = userEvent.setup();
    getAppointmentOverview.mockResolvedValue({
      upcoming: [makeAppointment()],
      requested: [],
      completed: [],
    });

    renderWithQueryClient(<AppointmentOverview />);

    await waitFor(() =>
      expect(screen.getByRole("tablist")).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("tab", { name: /Completed/ }));
    expect(
      screen.getByText("No completed appointments yet."),
    ).toBeInTheDocument();
  });
});
