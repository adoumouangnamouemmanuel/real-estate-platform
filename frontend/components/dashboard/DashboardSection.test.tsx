import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Building2 } from "lucide-react";

import { DashboardSection } from "./DashboardSection";

describe("DashboardSection", () => {
  it("renders its title as a heading and shows its children", () => {
    render(
      <DashboardSection title="Recent Listings">
        <p>Body content</p>
      </DashboardSection>,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Recent Listings" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("renders an optional description and action slot", () => {
    render(
      <DashboardSection
        title="Notifications"
        description="Your latest updates."
        icon={Building2}
        action={<button type="button">View all</button>}
      >
        <p>Body</p>
      </DashboardSection>,
    );

    expect(screen.getByText("Your latest updates.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View all" }),
    ).toBeInTheDocument();
  });
});
