import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { notificationService } from "@/services";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";

import { DashboardSidebar } from "./DashboardSidebar";

let mockPathname = "/dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return {
    ...actual,
    notificationService: {
      ...actual.notificationService,
      getUnreadCount: vi.fn(),
    },
  };
});

const getUnreadCount = vi.mocked(notificationService.getUnreadCount);

describe("DashboardSidebar", () => {
  beforeEach(() => getUnreadCount.mockReset());

  it("marks the current route as the active page", () => {
    mockPathname = "/dashboard";
    getUnreadCount.mockResolvedValue(0);
    renderWithQueryClient(<DashboardSidebar />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("does not mark other enabled routes as active", () => {
    mockPathname = "/dashboard";
    getUnreadCount.mockResolvedValue(0);
    renderWithQueryClient(<DashboardSidebar />);

    // Dashboard and My Properties are real links as of Phase 6.2; neither is
    // marked active while on /dashboard.
    expect(
      screen.getByRole("link", { name: "My Properties" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("renders My Properties as a live link now that Phase 6.2 has shipped", () => {
    getUnreadCount.mockResolvedValue(0);
    renderWithQueryClient(<DashboardSidebar />);

    expect(screen.getByRole("link", { name: "My Properties" })).toHaveAttribute(
      "href",
      "/listings",
    );
  });

  it("renders Appointments as a live link now that Phase 6.4 has shipped", () => {
    getUnreadCount.mockResolvedValue(0);
    renderWithQueryClient(<DashboardSidebar />);

    expect(
      screen.getByRole("link", { name: /Appointments/ }),
    ).toHaveAttribute("href", "/appointments");
  });

  it("renders Notifications as a live link now that Phase 6.6 has shipped", () => {
    getUnreadCount.mockResolvedValue(0);
    renderWithQueryClient(<DashboardSidebar />);

    expect(
      screen.getByRole("link", { name: /Notifications/ }),
    ).toHaveAttribute("href", "/notifications");
  });

  it("shows an unread count badge on Notifications when there are unread notifications", async () => {
    getUnreadCount.mockResolvedValue(3);
    renderWithQueryClient(<DashboardSidebar />);

    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: /Notifications/ }),
      ).toHaveTextContent("3"),
    );
  });

  it("shows no badge on Notifications when there are no unread notifications", async () => {
    getUnreadCount.mockResolvedValue(0);
    renderWithQueryClient(<DashboardSidebar />);

    await waitFor(() =>
      expect(screen.getByRole("link", { name: /Notifications/ })).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("link", { name: /Notifications/ }),
    ).not.toHaveTextContent(/\d/);
  });

  it("renders not-yet-shipped destinations as disabled, with a Soon badge, not as broken links", () => {
    getUnreadCount.mockResolvedValue(0);
    renderWithQueryClient(<DashboardSidebar />);

    const analytics = screen.getByRole("button", { name: /Analytics/ });
    expect(analytics).toBeDisabled();
    expect(screen.getAllByText("Soon").length).toBeGreaterThan(0);
  });

  it("renders every nav destination from the shared config", () => {
    getUnreadCount.mockResolvedValue(0);
    renderWithQueryClient(<DashboardSidebar />);

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
