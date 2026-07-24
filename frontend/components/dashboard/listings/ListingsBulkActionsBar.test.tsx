import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ListingsBulkActionsBar } from "./ListingsBulkActionsBar";

describe("ListingsBulkActionsBar", () => {
  it("renders nothing when no rows are selected", () => {
    const { container } = render(
      <ListingsBulkActionsBar
        selectedCount={0}
        onClearSelection={vi.fn()}
        onBulkStatus={vi.fn()}
        onBulkDeleteRequest={vi.fn()}
        isPending={false}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the selected count and dispatches each action", async () => {
    const user = userEvent.setup();
    const onBulkStatus = vi.fn();
    const onBulkDeleteRequest = vi.fn();
    const onClearSelection = vi.fn();

    render(
      <ListingsBulkActionsBar
        selectedCount={3}
        onClearSelection={onClearSelection}
        onBulkStatus={onBulkStatus}
        onBulkDeleteRequest={onBulkDeleteRequest}
        isPending={false}
      />,
    );

    expect(screen.getByText("3 selected")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Publish / Reopen" }));
    expect(onBulkStatus).toHaveBeenCalledWith("ACTIVE");

    await user.click(screen.getByRole("button", { name: "Suspend" }));
    expect(onBulkStatus).toHaveBeenCalledWith("SUSPENDED");

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onBulkDeleteRequest).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(onClearSelection).toHaveBeenCalled();
  });

  it("disables every action while a bulk mutation is pending", () => {
    render(
      <ListingsBulkActionsBar
        selectedCount={2}
        onClearSelection={vi.fn()}
        onBulkStatus={vi.fn()}
        onBulkDeleteRequest={vi.fn()}
        isPending
      />,
    );

    expect(
      screen.getByRole("button", { name: "Publish / Reopen" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Suspend" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });
});
