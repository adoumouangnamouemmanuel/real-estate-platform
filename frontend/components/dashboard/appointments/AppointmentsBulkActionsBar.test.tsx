import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AppointmentsBulkActionsBar } from "./AppointmentsBulkActionsBar";

describe("AppointmentsBulkActionsBar", () => {
  it("renders nothing when no rows are selected", () => {
    const { container } = render(
      <AppointmentsBulkActionsBar
        selectedCount={0}
        onClearSelection={vi.fn()}
        onBulkStatus={vi.fn()}
        isPending={false}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("only offers Confirm and Cancel — never Reschedule, Complete, or No Show", () => {
    render(
      <AppointmentsBulkActionsBar
        selectedCount={3}
        onClearSelection={vi.fn()}
        onBulkStatus={vi.fn()}
        isPending={false}
      />,
    );

    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reschedule" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mark Complete" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mark No-Show" }),
    ).not.toBeInTheDocument();
  });

  it("shows the selected count and dispatches each action", async () => {
    const user = userEvent.setup();
    const onBulkStatus = vi.fn();
    const onClearSelection = vi.fn();

    render(
      <AppointmentsBulkActionsBar
        selectedCount={3}
        onClearSelection={onClearSelection}
        onBulkStatus={onBulkStatus}
        isPending={false}
      />,
    );

    expect(screen.getByText("3 selected")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onBulkStatus).toHaveBeenCalledWith("CONFIRMED");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onBulkStatus).toHaveBeenCalledWith("CANCELLED");

    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(onClearSelection).toHaveBeenCalled();
  });

  it("disables every action while a bulk mutation is pending", () => {
    render(
      <AppointmentsBulkActionsBar
        selectedCount={2}
        onClearSelection={vi.fn()}
        onBulkStatus={vi.fn()}
        isPending
      />,
    );

    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("disables an action when none of the selection is eligible for it", () => {
    render(
      <AppointmentsBulkActionsBar
        selectedCount={2}
        onClearSelection={vi.fn()}
        onBulkStatus={vi.fn()}
        isPending={false}
        selectedStatuses={["COMPLETED", "CANCELLED"]}
      />,
    );

    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("keeps an action enabled when at least one selected appointment is eligible", () => {
    render(
      <AppointmentsBulkActionsBar
        selectedCount={2}
        onClearSelection={vi.fn()}
        onBulkStatus={vi.fn()}
        isPending={false}
        selectedStatuses={["REQUESTED", "COMPLETED"]}
      />,
    );

    expect(screen.getByRole("button", { name: "Confirm" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).not.toBeDisabled();
  });
});
