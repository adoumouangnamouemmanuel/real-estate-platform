import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { makeAppointment } from "@/test/fixtures";
import type { Appointment } from "@/types";

import { AppointmentsTable } from "./AppointmentsTable";

/**
 * The jsdom matchMedia stub (vitest.setup.ts) always reports `matches: false`,
 * so every test above this renders the desktop table. This flips it to make
 * the sub-`md` card presentation render instead.
 */
function useMobileViewport() {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

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
  it("flags a REQUESTED appointment whose date has passed as overdue, but not one still in the future", () => {
    const overdue: Appointment = makeAppointment({
      id: "ov1",
      clientName: "Overdue Client",
      status: "REQUESTED",
      scheduledFor: "2020-01-01T10:00:00.000Z",
    });
    renderTable({ appointments: [overdue, requested] });

    const rows = screen.getAllByRole("row");
    const overdueRow = rows.find((row) =>
      row.textContent?.includes("Overdue Client"),
    );
    const requestedRow = rows.find((row) =>
      row.textContent?.includes("Requested Client"),
    );

    expect(overdueRow?.textContent).toContain("Overdue");
    expect(requestedRow?.textContent).not.toContain("Overdue");
  });

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

  it("offers a direct Confirm button plus Cancel (in the menu) for a REQUESTED appointment", async () => {
    const user = userEvent.setup();
    renderTable();

    expect(
      screen.getByLabelText("Confirm appointment with Requested Client"),
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText("Actions for Requested Client"));

    expect(
      await screen.findByRole("menuitem", { name: "View details" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Cancel" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Confirm" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Mark Complete" }),
    ).not.toBeInTheDocument();
  });

  it("offers no lifecycle actions for a terminal (COMPLETED) appointment", async () => {
    const user = userEvent.setup();
    renderTable();

    expect(
      screen.queryByLabelText("Confirm appointment with Completed Client"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Actions for Completed Client"));

    expect(
      await screen.findByRole("menuitem", { name: "View details" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Confirm" }),
    ).not.toBeInTheDocument();
  });

  it("dispatches onAction from the direct Confirm button", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    renderTable({ onAction });

    await user.click(
      screen.getByLabelText("Confirm appointment with Requested Client"),
    );

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

  it("disables a row's action trigger and direct Confirm button while it has a mutation pending", () => {
    renderTable({ pendingIds: new Set(["r1"]) });

    expect(
      screen.getByLabelText("Actions for Requested Client"),
    ).toBeDisabled();
    expect(
      screen.getByLabelText("Confirm appointment with Requested Client"),
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

  describe("below md (card presentation)", () => {
    let restore: () => void;
    afterEach(() => restore?.());

    it("renders cards instead of a table, with no duplicate table in the DOM", () => {
      restore = useMobileViewport();
      renderTable();

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      // Same rows, same accessible names — each present exactly once.
      expect(
        screen.getByLabelText("Actions for Requested Client"),
      ).toBeInTheDocument();
      expect(screen.getAllByLabelText(/^Actions for /)).toHaveLength(3);
    });

    it("keeps status, property, time and the overdue flag visible without horizontal scrolling", () => {
      restore = useMobileViewport();
      const overdue: Appointment = makeAppointment({
        id: "ov-m",
        clientName: "Overdue Client",
        status: "REQUESTED",
        scheduledFor: "2020-01-01T10:00:00.000Z",
      });
      renderTable({ appointments: [overdue] });

      expect(screen.getByText("Overdue Client")).toBeInTheDocument();
      expect(screen.getByText(overdue.propertyTitle)).toBeInTheDocument();
      expect(screen.getByText("Requested")).toBeInTheDocument();
      expect(screen.getByText("Overdue")).toBeInTheDocument();
    });

    it("still drives every action from AppointmentActionPolicy", async () => {
      restore = useMobileViewport();
      const user = userEvent.setup();
      const onAction = vi.fn();
      renderTable({ onAction });

      // REQUESTED keeps its promoted Confirm button…
      await user.click(
        screen.getByLabelText("Confirm appointment with Requested Client"),
      );
      expect(onAction).toHaveBeenCalledWith(
        requested,
        expect.objectContaining({ key: "CONFIRM", target: "CONFIRMED" }),
      );

      // …and a terminal appointment still offers no lifecycle actions.
      await user.click(screen.getByLabelText("Actions for Completed Client"));
      expect(
        await screen.findByRole("menuitem", { name: "View details" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("menuitem", { name: "Confirm" }),
      ).not.toBeInTheDocument();
    });

    it("keeps bulk selection working", async () => {
      restore = useMobileViewport();
      const user = userEvent.setup();
      const onToggleRow = vi.fn();
      const onToggleAll = vi.fn();
      renderTable({ onToggleRow, onToggleAll });

      await user.click(
        screen.getByLabelText("Select appointment with Requested Client"),
      );
      expect(onToggleRow).toHaveBeenCalledWith("r1");

      await user.click(
        screen.getByLabelText("Select all appointments on this page"),
      );
      expect(onToggleAll).toHaveBeenCalled();
    });
  });
});
