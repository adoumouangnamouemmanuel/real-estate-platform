import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { authService } from "@/services";
import { useAuthStore } from "@/store/authStore";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return { ...actual, authService: { register: vi.fn() } };
});

const register = vi.mocked(authService.register);

/** Mirrors app/(auth)/register/page.tsx's actual composition. */
function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Browse and save properties"
    >
      <RegisterForm />
    </AuthCard>
  );
}

describe("Registration flow (page-level composition)", () => {
  beforeEach(() => {
    push.mockClear();
    register.mockReset();
    useAuthStore.getState().clearAuth();
  });

  it("auto-authenticates in the real store and redirects home for a new USER account", async () => {
    const user = userEvent.setup();
    register.mockResolvedValue({
      user: {
        id: "u2",
        fullName: "Kwame Mensah",
        email: "kwame@example.com",
        role: "USER",
      },
      accessToken: "mock-token",
    });

    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Full name"), "Kwame Mensah");
    await user.type(
      screen.getByLabelText("Email", { exact: true }),
      "kwame@example.com",
    );
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "Password123",
    );
    await user.type(
      screen.getByLabelText("Confirm password", { exact: true }),
      "Password123",
    );
    await user.click(screen.getByLabelText(/I agree to the Terms/));
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await vi.waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
    expect(useAuthStore.getState().user?.role).toBe("USER");
    expect(push).toHaveBeenCalledWith("/");
  });

  it("never calls the service when client-side validation fails", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    // Submit completely empty — required-field errors should block the call.
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Enter your full name."),
    ).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
