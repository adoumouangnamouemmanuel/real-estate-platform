import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardHomePage from "@/app/(dashboard)/dashboard/page";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useAuthStore } from "@/store/authStore";

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

    render(
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

    // Page content: no analytics data yet, honest empty state instead.
    expect(
      screen.getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Your dashboard is ready")).toBeInTheDocument();

    expect(replace).not.toHaveBeenCalled();
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

    render(
      <RequireAuth role="DEVELOPER">
        <DashboardShell>
          <DashboardHomePage />
        </DashboardShell>
      </RequireAuth>,
    );

    expect(replace).toHaveBeenCalledWith("/forbidden");
    expect(
      screen.queryByText("Your dashboard is ready"),
    ).not.toBeInTheDocument();
  });
});
