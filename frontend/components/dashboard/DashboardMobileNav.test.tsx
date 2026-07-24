import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { notificationService } from "@/services";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";

import { DashboardMobileNav } from "./DashboardMobileNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
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

describe("DashboardMobileNav", () => {
  beforeEach(() => getUnreadCount.mockReset());

  it("shows the top 3 destinations plus a More tab", () => {
    getUnreadCount.mockResolvedValue(0);
    renderWithQueryClient(<DashboardMobileNav />);

    expect(screen.getByRole("link", { name: /Dashboard/ })).toBeInTheDocument();
    // My Properties shipped in Phase 6.2, Appointments in Phase 6.4 — both are
    // live links now, not disabled buttons.
    expect(
      screen.getByRole("link", { name: /My Properties/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Appointments/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /More/ })).toBeInTheDocument();
  });

  it("opens a sheet with the remaining destinations when More is tapped", async () => {
    const user = userEvent.setup();
    getUnreadCount.mockResolvedValue(0);
    renderWithQueryClient(<DashboardMobileNav />);

    expect(screen.queryByText("Analytics")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /More/ }));

    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Account Settings")).toBeInTheDocument();
  });

  it("shows an unread count badge next to Notifications in the More sheet", async () => {
    const user = userEvent.setup();
    getUnreadCount.mockResolvedValue(4);
    renderWithQueryClient(<DashboardMobileNav />);

    await user.click(await screen.findByRole("button", { name: /More/ }));

    expect(
      screen.getByRole("link", { name: /Notifications/ }),
    ).toHaveTextContent("4");
  });

  it("marks the More tab with an unread indicator when Notifications has unread items", async () => {
    getUnreadCount.mockResolvedValue(2);
    renderWithQueryClient(<DashboardMobileNav />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /More.*unread notifications/ }),
      ).toBeInTheDocument(),
    );
  });
});
