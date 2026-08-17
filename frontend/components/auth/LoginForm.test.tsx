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

/**
 * Security regression guard. React's onSubmit only exists after hydration; a
 * submit before then is handled natively, and a form with no `method` defaults
 * to GET — which appends every field, including the password, to the URL. That
 * was reproduced on the running app before this was fixed. `method="post"`
 * makes the pre-hydration submit send the fields in the request body instead.
 * The end-to-end proof lives in e2e/auth-journey.spec.ts; this keeps the
 * attribute from being dropped in a refactor.
 */
it("submits as POST so a pre-hydration native submit cannot put the password in the URL", () => {
  const { container } = render(<LoginForm />);
  const form = container.querySelector("form");

  expect(form).toHaveAttribute("method", "post");
  // The password field must carry a name, or the leak wouldn't have been
  // possible in the first place — asserting it keeps this test honest about
  // what it is guarding.
  expect(container.querySelector('input[type="password"]')).toHaveAttribute(
    "name",
  );
});
