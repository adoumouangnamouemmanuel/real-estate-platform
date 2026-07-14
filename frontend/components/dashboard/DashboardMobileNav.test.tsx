import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DashboardMobileNav } from "./DashboardMobileNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("DashboardMobileNav", () => {
  it("shows the top 3 destinations plus a More tab", () => {
    render(<DashboardMobileNav />);

    expect(screen.getByRole("link", { name: /Dashboard/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /My Properties/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Appointments/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More" })).toBeInTheDocument();
  });

  it("opens a sheet with the remaining destinations when More is tapped", async () => {
    const user = userEvent.setup();
    render(<DashboardMobileNav />);

    expect(screen.queryByText("Analytics")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "More" }));

    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Account Settings")).toBeInTheDocument();
  });
});
