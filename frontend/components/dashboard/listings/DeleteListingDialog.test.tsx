import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DeleteListingDialog } from "./DeleteListingDialog";

describe("DeleteListingDialog", () => {
  it("names the single listing being deleted", () => {
    render(
      <DeleteListingDialog
        open
        onOpenChange={vi.fn()}
        target={{ title: "East Legon Apartment" }}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );

    expect(screen.getByRole("dialog")).toHaveTextContent(
      "East Legon Apartment",
    );
    expect(
      screen.getByRole("heading", { name: "Delete listing?" }),
    ).toBeInTheDocument();
  });

  it("pluralizes for a bulk delete of more than one listing", () => {
    render(
      <DeleteListingDialog
        open
        onOpenChange={vi.fn()}
        target={{ count: 3 }}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Delete listings?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveTextContent("3");
  });

  it("confirms and cancels", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <DeleteListingDialog
        open
        onOpenChange={onOpenChange}
        target={{ count: 1 }}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables both actions while pending", () => {
    render(
      <DeleteListingDialog
        open
        onOpenChange={vi.fn()}
        target={{ count: 1 }}
        onConfirm={vi.fn()}
        isPending
      />,
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Deleting…" })).toBeDisabled();
  });
});
