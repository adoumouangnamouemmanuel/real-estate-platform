import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authService } from "@/services";
import { useAuthStore } from "@/store/authStore";

import { DashboardUserMenu } from "./DashboardUserMenu";

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return { ...actual, authService: { logout: vi.fn() } };
});

const logout = vi.mocked(authService.logout);

describe("DashboardUserMenu", () => {
  beforeEach(() => {
    logout.mockReset();
    logout.mockResolvedValue(undefined);
    useAuthStore.getState().setAuth(
      {
        id: "u2",
        fullName: "Kwame Mensah",
        email: "developer@byte.africa",
        role: "DEVELOPER",
      },
      "token",
    );
  });

  it("renders nothing when there is no signed-in user", () => {
    useAuthStore.getState().clearAuth();
    const { container } = render(<DashboardUserMenu />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the user's initials as the trigger", () => {
    render(<DashboardUserMenu />);

    expect(
      screen.getByLabelText("Account menu for Kwame Mensah"),
    ).toBeInTheDocument();
    expect(screen.getByText("KM")).toBeInTheDocument();
  });

  it("shows the user's name and role, and logs out, when opened", async () => {
    const user = userEvent.setup();
    render(<DashboardUserMenu />);

    await user.click(screen.getByLabelText("Account menu for Kwame Mensah"));

    // Base UI's Menu popup mounts asynchronously (positioning + open transition) —
    // findBy* polls until it appears rather than assuming it's there on the next tick.
    expect(await screen.findByText("Kwame Mensah")).toBeInTheDocument();
    // Product-facing label (lib/roles.ts), not the raw internal role value.
    expect(screen.getByText("Developer")).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Log out" }));

    expect(logout).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("links to the public site", async () => {
    const user = userEvent.setup();
    render(<DashboardUserMenu />);

    await user.click(screen.getByLabelText("Account menu for Kwame Mensah"));

    expect(
      await screen.findByRole("menuitem", { name: /View public site/ }),
    ).toHaveAttribute("href", "/");
  });
});
