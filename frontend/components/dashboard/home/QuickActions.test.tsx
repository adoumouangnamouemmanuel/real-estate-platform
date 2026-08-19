import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuickActions } from "./QuickActions";

describe("QuickActions", () => {
  it("lists every shipped action label", () => {
    render(<QuickActions />);

    expect(screen.getByText("Add Property")).toBeInTheDocument();
    expect(screen.getByText("View Listings")).toBeInTheDocument();
    expect(screen.getByText("View Appointments")).toBeInTheDocument();
  });

  it("omits actions whose feature has not shipped", () => {
    render(<QuickActions />);

    // DASHBOARD_PROFILE is still false, so the Edit Company Profile action is
    // absent entirely rather than present as a disabled control.
    expect(screen.queryByText("Edit Company Profile")).not.toBeInTheDocument();
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

  it("renders only reachable links — no disabled or 'Soon' controls", () => {
    render(<QuickActions />);

    // The panel previously rendered unshipped actions as disabled "Soon"
    // buttons, which advertised functionality the product does not have on the
    // first authenticated screen. Every action now present must be a real,
    // followable link to a route that exists.
    expect(screen.queryByText("Soon")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    links.forEach((link) => {
      expect(link).toHaveAttribute("href", expect.stringMatching(/^\//));
      expect(link).not.toHaveAttribute("aria-disabled", "true");
    });
  });
});
