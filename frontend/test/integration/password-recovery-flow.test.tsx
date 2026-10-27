import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { InvalidResetLink } from "@/components/auth/InvalidResetLink";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { authService } from "@/services";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return {
    ...actual,
    authService: {
      requestPasswordReset: vi.fn(),
      validateResetToken: vi.fn(),
      resetPassword: vi.fn(),
    },
  };
});

const requestPasswordReset = vi.mocked(authService.requestPasswordReset);
const validateResetToken = vi.mocked(authService.validateResetToken);
const resetPassword = vi.mocked(authService.resetPassword);

/** Mirrors app/(auth)/forgot-password/page.tsx and reset-password/page.tsx's compositions. */
function ForgotPasswordPage() {
  return (
    <AuthCard title="Forgot your password?" description="Enter your email">
      <ForgotPasswordForm />
    </AuthCard>
  );
}

function ResetPasswordPage({ token }: { token?: string }) {
  return (
    <AuthCard
      title="Reset your password"
      description="Choose a new password below"
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <InvalidResetLink reason="missing" />
      )}
    </AuthCard>
  );
}

describe("Password recovery flow (page-level composition)", () => {
  beforeEach(() => {
    push.mockClear();
    requestPasswordReset.mockReset();
    validateResetToken.mockReset();
    resetPassword.mockReset();
  });

  it("shows the anti-enumeration confirmation regardless of account existence", async () => {
    const user = userEvent.setup();
    requestPasswordReset.mockResolvedValue(undefined);

    render(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText("Email"), "unknown@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
  });

  it("renders the missing-link state when the reset page has no token at all", () => {
    render(<ResetPasswordPage />);

    expect(screen.getByText("This link is invalid")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Request new link" }),
    ).toHaveAttribute("href", "/forgot-password");
  });

  it("validates the token, accepts a new password, and redirects to login", async () => {
    validateResetToken.mockResolvedValue({ valid: true, expired: false });
    resetPassword.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<ResetPasswordPage token="valid-token-demo" />);

    await screen.findByLabelText("New password");
    await user.type(screen.getByLabelText("New password"), "BrandNewPass1");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "BrandNewPass1",
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    await vi.waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith({
        token: "valid-token-demo",
        password: "BrandNewPass1",
      });
    });
    expect(push).toHaveBeenCalledWith("/login?reset=success");
  });

  it("reports an expired link when the one-time reset is submitted", async () => {
    resetPassword.mockRejectedValue(
      new Error("This reset link is invalid or expired"),
    );
    const user = userEvent.setup();
    render(<ResetPasswordPage token="expired-token" />);
    await user.type(screen.getByLabelText("New password"), "BrandNewPass1");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "BrandNewPass1",
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));
    expect(
      await screen.findByText("This reset link is invalid or expired"),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
