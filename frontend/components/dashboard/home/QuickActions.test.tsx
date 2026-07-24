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

  it("links 'View Listings' now that My Properties (Phase 6.2) has shipped", () => {
    render(<QuickActions />);

    expect(screen.getByRole("link", { name: /View Listings/ })).toHaveAttribute(
      "href",
      "/listings",
    );
  });

  it("links 'Add Property' now that the Property Editor (Phase 6.3) has shipped", () => {
    render(<QuickActions />);

    expect(screen.getByRole("link", { name: /Add Property/ })).toHaveAttribute(
      "href",
      "/listings/new",
    );
  });

  it("still gates not-yet-shipped actions as disabled 'Soon' controls, not broken links", () => {
    render(<QuickActions />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((button) => expect(button).toBeDisabled());
    expect(screen.getAllByText("Soon").length).toBe(buttons.length);
  });
});
