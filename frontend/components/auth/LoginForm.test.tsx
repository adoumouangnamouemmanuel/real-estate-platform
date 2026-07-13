import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authService } from "@/services";
import { useAuthStore } from "@/store/authStore";

import { LoginForm } from "./LoginForm";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return { ...actual, authService: { login: vi.fn() } };
});

const login = vi.mocked(authService.login);

describe("LoginForm", () => {
  beforeEach(() => {
    push.mockClear();
    login.mockReset();
    // useAuth() writes to the real Zustand store (a module-level singleton) —
    // reset it so a success in one test doesn't leave isAuthenticated=true for the next.
    useAuthStore.getState().clearAuth();
  });

  it("shows validation errors instead of submitting when the email is invalid", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password", { exact: true }), "x");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("shows a generic error message on failed login without leaking which field was wrong", async () => {
    const user = userEvent.setup();
    login.mockRejectedValue(new Error("Invalid email or password."));
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "wrong",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Invalid email or password."),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("redirects to the safe redirectTo path on success, ignoring an unsafe one", async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({
      user: {
        id: "u1",
        fullName: "Test",
        email: "test@example.com",
        role: "USER",
      },
      accessToken: "token",
    });
    render(<LoginForm redirectTo="https://evil.example" />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "Password123",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });

  it("honors a safe redirectTo path on success", async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({
      user: {
        id: "u1",
        fullName: "Test",
        email: "test@example.com",
        role: "USER",
      },
      accessToken: "token",
    });
    render(<LoginForm redirectTo="/properties" />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "Password123",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/properties"));
  });

  it("disables the submit button while submitting", async () => {
    const user = userEvent.setup();
    let resolveLogin: (
      value: Awaited<ReturnType<typeof authService.login>>,
    ) => void = () => {};
    login.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      }),
    );
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "Password123",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
    resolveLogin({
      user: {
        id: "u1",
        fullName: "Test",
        email: "test@example.com",
        role: "USER",
      },
      accessToken: "token",
    });
  });
});
