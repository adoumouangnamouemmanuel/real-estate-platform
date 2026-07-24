import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { makeAppointment } from "@/test/fixtures";
import type { Appointment } from "@/types";

import { AppointmentsTable } from "./AppointmentsTable";

const requested: Appointment = makeAppointment({
  id: "r1",
  clientName: "Requested Client",
  status: "REQUESTED",
  scheduledFor: "2030-03-01T10:00:00.000Z",
});
const confirmed: Appointment = makeAppointment({
  id: "c1",
  clientName: "Confirmed Client",
  status: "CONFIRMED",
  scheduledFor: "2030-03-02T10:00:00.000Z",
});
const completed: Appointment = makeAppointment({
  id: "co1",
  clientName: "Completed Client",
  status: "COMPLETED",
  scheduledFor: "2030-03-03T10:00:00.000Z",
});

const noop = {
  onToggleRow: vi.fn(),
  onToggleAll: vi.fn(),
  onAction: vi.fn(),
  onViewDetails: vi.fn(),
  onClearFilters: vi.fn(),
};

function renderTable(
  overrides: Partial<React.ComponentProps<typeof AppointmentsTable>> = {},
) {
  return render(
    <AppointmentsTable
      appointments={[requested, confirmed, completed]}
      isLoading={false}
      isError={false}
      selectedIds={new Set()}
      pendingIds={new Set()}
      hasActiveFilters={false}
      {...noop}
      {...overrides}
    />,
  );
}

describe("AppointmentsTable", () => {
  it("renders each appointment's client, property, and status", () => {
    renderTable();

    expect(screen.getByText("Requested Client")).toBeInTheDocument();
    expect(screen.getByText("Confirmed Client")).toBeInTheDocument();
    expect(screen.getByText("Completed Client")).toBeInTheDocument();
    expect(screen.getByText("Requested")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("calls onToggleRow when a row checkbox is toggled", async () => {
    const user = userEvent.setup();
    const onToggleRow = vi.fn();
    renderTable({ onToggleRow });

    await user.click(
      screen.getByLabelText("Select appointment with Requested Client"),
    );
    expect(onToggleRow).toHaveBeenCalledWith("r1");
  });

  it("calls onToggleAll when the header checkbox is toggled", async () => {
    const user = userEvent.setup();
    const onToggleAll = vi.fn();
    renderTable({ onToggleAll });

    await user.click(
      screen.getByLabelText("Select all appointments on this page"),
    );
    expect(onToggleAll).toHaveBeenCalled();
  });

  it("only offers Confirm and Cancel for a REQUESTED appointment", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByLabelText("Actions for Requested Client"));

    expect(
      await screen.findByRole("menuitem", { name: "View details" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Confirm" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Cancel" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Mark Complete" }),
    ).not.toBeInTheDocument();
  });

  it("offers no lifecycle actions for a terminal (COMPLETED) appointment", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByLabelText("Actions for Completed Client"));

    expect(
      await screen.findByRole("menuitem", { name: "View details" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Confirm" }),
    ).not.toBeInTheDocument();
  });

  it("dispatches onAction with the chosen action", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    renderTable({ onAction });

    await user.click(screen.getByLabelText("Actions for Requested Client"));
    await user.click(await screen.findByRole("menuitem", { name: "Confirm" }));

    expect(onAction).toHaveBeenCalledWith(
      requested,
      expect.objectContaining({ key: "CONFIRM", target: "CONFIRMED" }),
    );
  });

  it("dispatches onViewDetails", async () => {
    const user = userEvent.setup();
    const onViewDetails = vi.fn();
    renderTable({ onViewDetails });

    await user.click(screen.getByLabelText("Actions for Requested Client"));
    await user.click(
      await screen.findByRole("menuitem", { name: "View details" }),
    );

    expect(onViewDetails).toHaveBeenCalledWith(requested);
  });

  it("disables a row's action trigger while it has a mutation pending", () => {
    renderTable({ pendingIds: new Set(["r1"]) });

    expect(
      screen.getByLabelText("Actions for Requested Client"),
    ).toBeDisabled();
    expect(
      screen.getByLabelText("Actions for Confirmed Client"),
    ).not.toBeDisabled();
  });

  it("shows a loading skeleton", () => {
    renderTable({ isLoading: true, appointments: [] });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows an error state with the given message", () => {
    renderTable({
      isError: true,
      appointments: [],
      error: new Error("Network unreachable"),
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't load your appointments.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Network unreachable");
  });

  it("shows the true-empty state when there are no appointments at all", () => {
    renderTable({ appointments: [], hasActiveFilters: false });
    expect(screen.getByText("No appointments yet")).toBeInTheDocument();
  });

  it("shows the filtered-empty state with a clear-filters action", async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();
    renderTable({
      appointments: [],
      hasActiveFilters: true,
      onClearFilters,
    });

    expect(
      screen.getByText("No appointments match your filters"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClearFilters).toHaveBeenCalled();
  });
});
