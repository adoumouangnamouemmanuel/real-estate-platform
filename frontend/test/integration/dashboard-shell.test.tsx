import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardHomePage from "@/app/(dashboard)/dashboard/page";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useAuthStore } from "@/store/authStore";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/dashboard",
}));

describe("Dashboard shell (real store, RequireAuth + chrome + Home page composed)", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("renders the full dashboard chrome and Home content for an authenticated developer", () => {
    useAuthStore.getState().setAuth(
      {
        id: "u2",
        fullName: "Kwame Mensah",
        email: "developer@byte.africa",
        role: "DEVELOPER",
      },
      "token",
    );
    useAuthStore.getState().setBootstrapped();

    renderWithQueryClient(
      <RequireAuth role="DEVELOPER">
        <DashboardShell>
          <DashboardHomePage />
        </DashboardShell>
      </RequireAuth>,
    );

    // Chrome: both the desktop sidebar and the mobile nav render (CSS, not jsdom,
    // is what hides one of them per breakpoint) + the account menu.
    expect(
      screen.getAllByRole("navigation", { name: "Dashboard" }),
    ).toHaveLength(2);
    expect(
      screen.getByLabelText("Account menu for Kwame Mensah"),
    ).toBeInTheDocument();

    // Page content: the Dashboard Home welcome header greets the developer by name.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Kwame/,
    );

    expect(replace).not.toHaveBeenCalled();
  });

  it("renders a skip-to-content link targeting the main landmark", () => {
    useAuthStore.getState().setAuth(
      {
        id: "u2",
        fullName: "Kwame Mensah",
        email: "developer@byte.africa",
        role: "DEVELOPER",
      },
      "token",
    );
    useAuthStore.getState().setBootstrapped();

    renderWithQueryClient(
      <RequireAuth role="DEVELOPER">
        <DashboardShell>
          <DashboardHomePage />
        </DashboardShell>
      </RequireAuth>,
    );

    const skipLink = screen.getByRole("link", { name: "Skip to main content" });
    const targetId = skipLink.getAttribute("href")?.slice(1);
    expect(targetId).toBeTruthy();
    expect(document.getElementById(targetId!)).toBe(screen.getByRole("main"));
  });

  it("never renders the dashboard for a signed-in USER — redirects to /forbidden instead", () => {
    useAuthStore.getState().setAuth(
      {
        id: "u1",
        fullName: "Ama Boateng",
        email: "demo@byte.africa",
        role: "USER",
      },
      "token",
    );
    useAuthStore.getState().setBootstrapped();

    renderWithQueryClient(
      <RequireAuth role="DEVELOPER">
        <DashboardShell>
          <DashboardHomePage />
        </DashboardShell>
      </RequireAuth>,
    );

    expect(replace).toHaveBeenCalledWith("/forbidden");
    // RequireAuth renders its loading fallback for a wrong-role user, so the
    // Dashboard Home content (the welcome greeting) never mounts.
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });
});
