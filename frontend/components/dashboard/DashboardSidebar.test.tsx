import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardSidebar } from "./DashboardSidebar";

let mockPathname = "/dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

describe("DashboardSidebar", () => {
  it("marks the current route as the active page", () => {
    mockPathname = "/dashboard";
    render(<DashboardSidebar />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("does not mark other enabled routes as active", () => {
    mockPathname = "/dashboard";
    render(<DashboardSidebar />);

    // Every flagged-off item renders as a disabled button, not a link — Dashboard
    // is the only real link in Phase 6.0, so there's nothing else to assert "not
    // active" against yet. This guards that assumption explicitly.
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("renders not-yet-shipped destinations as disabled, with a Soon badge, not as broken links", () => {
    render(<DashboardSidebar />);

    const myProperties = screen.getByRole("button", { name: /My Properties/ });
    expect(myProperties).toBeDisabled();
    expect(screen.getAllByText("Soon").length).toBeGreaterThan(0);
  });

  it("renders every nav destination from the shared config", () => {
    render(<DashboardSidebar />);

    for (const label of [
      "Dashboard",
      "My Properties",
      "Appointments",
      "Analytics",
      "Notifications",
      "Account Settings",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
