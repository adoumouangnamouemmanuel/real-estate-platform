import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore, type AuthState } from "@/store/authStore";

import { RequireAuth } from "./RequireAuth";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: vi.fn(),
}));

const mockedUseAuthStore = vi.mocked(useAuthStore);

interface MockState {
  user: { role: "USER" | "DEVELOPER" | "ADMIN" } | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
}

function mockAuthState(state: MockState) {
  mockedUseAuthStore.mockImplementation((selector) =>
    selector(state as unknown as AuthState),
  );
}

describe("RequireAuth", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("shows a loading state while bootstrapping, without redirecting yet", () => {
    mockAuthState({
      user: null,
      isAuthenticated: false,
      isBootstrapping: true,
    });

    render(
      <RequireAuth>
        <p>Protected content</p>
      </RequireAuth>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects to /unauthorized when bootstrapping has resolved and there's no session", () => {
    mockAuthState({
      user: null,
      isAuthenticated: false,
      isBootstrapping: false,
    });

    render(
      <RequireAuth>
        <p>Protected content</p>
      </RequireAuth>,
    );

    expect(replace).toHaveBeenCalledWith("/unauthorized");
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders protected content for an authenticated user with no role requirement", () => {
    mockAuthState({
      user: { role: "USER" },
      isAuthenticated: true,
      isBootstrapping: false,
    });

    render(
      <RequireAuth>
        <p>Protected content</p>
      </RequireAuth>,
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects to /forbidden when the user's role doesn't satisfy the requirement", () => {
    mockAuthState({
      user: { role: "USER" },
      isAuthenticated: true,
      isBootstrapping: false,
    });

    render(
      <RequireAuth role="DEVELOPER">
        <p>Dashboard content</p>
      </RequireAuth>,
    );

    expect(replace).toHaveBeenCalledWith("/forbidden");
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
  });

  it("allows an ADMIN into a DEVELOPER-gated route (role inheritance, ARCHITECTURE.md §6)", () => {
    mockAuthState({
      user: { role: "ADMIN" },
      isAuthenticated: true,
      isBootstrapping: false,
    });

    render(
      <RequireAuth role="DEVELOPER">
        <p>Dashboard content</p>
      </RequireAuth>,
    );

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("allows an exact role match", () => {
    mockAuthState({
      user: { role: "ADMIN" },
      isAuthenticated: true,
      isBootstrapping: false,
    });

    render(
      <RequireAuth role="ADMIN">
        <p>Admin content</p>
      </RequireAuth>,
    );

    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });
});
