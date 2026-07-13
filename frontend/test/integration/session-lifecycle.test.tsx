import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { NavbarAuthSection } from "@/components/layout/NavbarAuthSection";
import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";
import { authService } from "@/services";
import { useAuthStore } from "@/store/authStore";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return { ...actual, authService: { refresh: vi.fn() } };
});

const refresh = vi.mocked(authService.refresh);

/** Mirrors app/providers.tsx calling useAuthBootstrap once at the app root. */
function AppRoot({ children }: { children: React.ReactNode }) {
  useAuthBootstrap();
  return <>{children}</>;
}

describe("Session lifecycle (real store + real hooks, no mocked selectors)", () => {
  beforeEach(() => {
    replace.mockClear();
    refresh.mockReset();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isBootstrapping: true,
    });
  });

  it("restores a session end-to-end: bootstrap resolves, Navbar updates, protected content renders", async () => {
    refresh.mockResolvedValue({
      user: {
        id: "u1",
        fullName: "Ama Boateng",
        email: "demo@byte.africa",
        role: "DEVELOPER",
      },
      accessToken: "restored-token",
    });

    render(
      <AppRoot>
        <NavbarAuthSection />
        <RequireAuth role="DEVELOPER">
          <p>Dashboard content</p>
        </RequireAuth>
      </AppRoot>,
    );

    // Before bootstrap resolves, the guarded route shows its loading state —
    // the protected content isn't in the DOM at all yet, not just hidden.
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("Ama Boateng")).toBeInTheDocument(),
    );
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("leaves the user anonymous when the refresh cookie is invalid/absent — no crash, no infinite spinner", async () => {
    refresh.mockRejectedValue(new Error("No refresh cookie"));

    render(
      <AppRoot>
        <NavbarAuthSection />
      </AppRoot>,
    );

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument(),
    );
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("clears the session on logout after a successful restore", async () => {
    refresh.mockResolvedValue({
      user: {
        id: "u1",
        fullName: "Ama Boateng",
        email: "demo@byte.africa",
        role: "USER",
      },
      accessToken: "restored-token",
    });

    render(
      <AppRoot>
        <NavbarAuthSection />
      </AppRoot>,
    );

    await waitFor(() =>
      expect(screen.getByText("Ama Boateng")).toBeInTheDocument(),
    );

    // useAuth().logout() (exercised via the button click in NavbarAuthSection's
    // own unit tests) always ends by calling clearAuth() on the store — this
    // test isolates that this state transition alone correctly propagates back
    // out to every subscribed component, independent of the click handler.
    useAuthStore.getState().clearAuth();

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument(),
    );
  });
});
