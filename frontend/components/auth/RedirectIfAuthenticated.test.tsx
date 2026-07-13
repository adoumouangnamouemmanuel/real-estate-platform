import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore, type AuthState } from "@/store/authStore";

import { RedirectIfAuthenticated } from "./RedirectIfAuthenticated";

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
}

function mockAuthState(state: MockState) {
  mockedUseAuthStore.mockImplementation((selector) =>
    selector(state as unknown as AuthState),
  );
}

describe("RedirectIfAuthenticated", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("renders the form immediately for an anonymous visitor — does not wait out bootstrap", () => {
    mockAuthState({ user: null, isAuthenticated: false });

    render(
      <RedirectIfAuthenticated>
        <p>Login form</p>
      </RedirectIfAuthenticated>,
    );

    expect(screen.getByText("Login form")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects an already-authenticated USER home", () => {
    mockAuthState({ user: { role: "USER" }, isAuthenticated: true });

    render(
      <RedirectIfAuthenticated>
        <p>Login form</p>
      </RedirectIfAuthenticated>,
    );

    expect(replace).toHaveBeenCalledWith("/");
    expect(screen.queryByText("Login form")).not.toBeInTheDocument();
  });

  it("redirects an already-authenticated DEVELOPER to the dashboard", () => {
    mockAuthState({ user: { role: "DEVELOPER" }, isAuthenticated: true });

    render(
      <RedirectIfAuthenticated>
        <p>Login form</p>
      </RedirectIfAuthenticated>,
    );

    expect(replace).toHaveBeenCalledWith("/dashboard");
  });
});
