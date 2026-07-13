import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PasswordInput } from "./PasswordInput";

describe("PasswordInput", () => {
  it("masks the value by default", () => {
    render(<PasswordInput aria-label="Password" />);

    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("reveals the value when the toggle is clicked, and re-masks on a second click", async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Password" />);

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("keeps the toggle button out of the tab order for the input itself (type=button, not submit)", () => {
    render(<PasswordInput aria-label="Password" />);

    expect(
      screen.getByRole("button", { name: "Show password" }),
    ).toHaveAttribute("type", "button");
  });
});
