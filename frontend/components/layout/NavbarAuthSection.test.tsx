import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authService } from "@/services";
import { useAuthStore } from "@/store/authStore";

import { NavbarAuthSection } from "./NavbarAuthSection";

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return { ...actual, authService: { logout: vi.fn() } };
});

const logout = vi.mocked(authService.logout);

describe("NavbarAuthSection", () => {
  beforeEach(() => {
    logout.mockReset();
    logout.mockResolvedValue(undefined);
    useAuthStore.getState().clearAuth();
  });

  it("shows a Log in link when signed out", () => {
    render(<NavbarAuthSection />);

    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("shows the user's name and a Log out button when signed in", () => {
    useAuthStore.getState().setAuth(
      {
        id: "u1",
        fullName: "Ama Boateng",
        email: "ama@example.com",
        role: "USER",
      },
      "token",
    );

    render(<NavbarAuthSection />);

    expect(screen.getByText("Ama Boateng")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Log in" }),
    ).not.toBeInTheDocument();
  });

  it("clears the session when Log out is clicked", async () => {
    useAuthStore.getState().setAuth(
      {
        id: "u1",
        fullName: "Ama Boateng",
        email: "ama@example.com",
        role: "USER",
      },
      "token",
    );
    const user = userEvent.setup();
    render(<NavbarAuthSection />);

    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(logout).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
