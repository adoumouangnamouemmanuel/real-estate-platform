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

    // Dashboard and My Properties are real links as of Phase 6.2; neither is
    // marked active while on /dashboard.
    expect(
      screen.getByRole("link", { name: "My Properties" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("renders My Properties as a live link now that Phase 6.2 has shipped", () => {
    render(<DashboardSidebar />);

    expect(screen.getByRole("link", { name: "My Properties" })).toHaveAttribute(
      "href",
      "/listings",
    );
  });

  it("renders Appointments as a live link now that Phase 6.4 has shipped", () => {
    render(<DashboardSidebar />);

    expect(screen.getByRole("link", { name: /Appointments/ })).toHaveAttribute(
      "href",
      "/appointments",
    );
  });

  it("renders not-yet-shipped destinations as disabled, with a Soon badge, not as broken links", () => {
    render(<DashboardSidebar />);

    const analytics = screen.getByRole("button", { name: /Analytics/ });
    expect(analytics).toBeDisabled();
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
