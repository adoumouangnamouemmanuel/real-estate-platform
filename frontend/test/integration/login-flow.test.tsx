import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { APP_NAME } from "@/constants/config";
import { authService } from "@/services";
import { useAuthStore } from "@/store/authStore";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return { ...actual, authService: { login: vi.fn() } };
});

const login = vi.mocked(authService.login);

/** Mirrors app/(auth)/login/page.tsx's actual composition, since the async page itself can't be unit-tested. */
function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description={`Sign in to your ${APP_NAME} account`}
    >
      <LoginForm />
    </AuthCard>
  );
}

describe("Login flow (page-level composition)", () => {
  beforeEach(() => {
    push.mockClear();
    login.mockReset();
    useAuthStore.getState().clearAuth();
  });

  it("renders the app wordmark, heading, and form together", () => {
    render(<LoginPage />);

    expect(screen.getByText(APP_NAME)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Welcome back" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("authenticates and updates the real auth store on success", async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({
      user: {
        id: "u1",
        fullName: "Ama Boateng",
        email: "demo@byte.africa",
        role: "USER",
      },
      accessToken: "mock-token",
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "demo@byte.africa");
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "Password123",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await vi.waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
    expect(useAuthStore.getState().user?.fullName).toBe("Ama Boateng");
    expect(push).toHaveBeenCalledWith("/");
  });

  it("does not touch the auth store when login fails", async () => {
    const user = userEvent.setup();
    login.mockRejectedValue(new Error("Invalid email or password."));

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "demo@byte.africa");
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "wrongpassword",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Invalid email or password."),
    ).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(push).not.toHaveBeenCalled();
  });
});
