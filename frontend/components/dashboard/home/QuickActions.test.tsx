import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuickActions } from "./QuickActions";

describe("QuickActions", () => {
  it("lists every action label", () => {
    render(<QuickActions />);

    expect(screen.getByText("Add Property")).toBeInTheDocument();
    expect(screen.getByText("View Listings")).toBeInTheDocument();
    expect(screen.getByText("View Appointments")).toBeInTheDocument();
    expect(screen.getByText("Edit Company Profile")).toBeInTheDocument();
  });

  it("renders flag-gated actions as disabled 'Soon' controls, not broken links", () => {
    // All Phase 6.x destination flags are still off, so every action gates.
    render(<QuickActions />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((button) => expect(button).toBeDisabled());
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getAllByText("Soon").length).toBe(buttons.length);
  });
});
