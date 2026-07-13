import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authService } from "@/services";

import { ResetPasswordForm } from "./ResetPasswordForm";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return {
    ...actual,
    authService: { validateResetToken: vi.fn(), resetPassword: vi.fn() },
  };
});

const validateResetToken = vi.mocked(authService.validateResetToken);
const resetPassword = vi.mocked(authService.resetPassword);

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    push.mockClear();
    validateResetToken.mockReset();
    resetPassword.mockReset();
  });

  it("shows a loading state while the token is being validated", () => {
    validateResetToken.mockReturnValue(new Promise(() => {})); // never resolves
    render(<ResetPasswordForm token="some-token" />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows an expired-link message for an expired token, not the form", async () => {
    validateResetToken.mockResolvedValue({ valid: false, expired: true });
    render(<ResetPasswordForm token="expired-token" />);

    expect(
      await screen.findByText("This link has expired"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
  });

  it("shows an invalid-link message for an unknown token", async () => {
    validateResetToken.mockResolvedValue({ valid: false, expired: false });
    render(<ResetPasswordForm token="bogus-token" />);

    expect(await screen.findByText("This link is invalid")).toBeInTheDocument();
  });

  it("shows the form for a valid token and enforces matching passwords", async () => {
    validateResetToken.mockResolvedValue({ valid: true, expired: false });
    const user = userEvent.setup();
    render(<ResetPasswordForm token="valid-token" />);

    await screen.findByLabelText("New password");
    await user.type(screen.getByLabelText("New password"), "NewPassword123");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "Different123",
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(
      await screen.findByText("Passwords don't match."),
    ).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("resets the password and redirects to login with a success flag", async () => {
    validateResetToken.mockResolvedValue({ valid: true, expired: false });
    resetPassword.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ResetPasswordForm token="valid-token" />);

    await screen.findByLabelText("New password");
    await user.type(screen.getByLabelText("New password"), "NewPassword123");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "NewPassword123",
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/login?reset=success"),
    );
  });
});
