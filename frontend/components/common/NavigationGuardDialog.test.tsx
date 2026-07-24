import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NavigationGuardDialog } from "./NavigationGuardDialog";

describe("NavigationGuardDialog", () => {
  it("shows the given message when open", () => {
    render(
      <NavigationGuardDialog
        open
        message="You have unsaved changes. Leave without saving?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByText("You have unsaved changes. Leave without saving?"),
    ).toBeInTheDocument();
  });

  it("confirms and cancels", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <NavigationGuardDialog
        open
        message="Leave?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Leave" }));
    expect(onConfirm).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Stay" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
