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

    expect(screen.getByRole("link", { name: "Connexion" })).toHaveAttribute(
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
    expect(screen.getByRole("button", { name: "Déconnexion" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Connexion" }),
    ).not.toBeInTheDocument();
  });

  it("does not show a Dashboard link for a plain USER/client", () => {
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

    expect(
      screen.queryByRole("link", { name: /dashboard/i }),
    ).not.toBeInTheDocument();
  });

  it("shows a Dashboard link for a DEVELOPER, without requiring logout", () => {
    useAuthStore.getState().setAuth(
      {
        id: "u1",
        fullName: "Kofi Mensah",
        email: "kofi@example.com",
        role: "DEVELOPER",
      },
      "token",
    );

    render(<NavbarAuthSection />);

    expect(screen.getByRole("link", { name: /tableau de bord/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("button", { name: "Déconnexion" })).toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: "Déconnexion" }));

    expect(logout).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
