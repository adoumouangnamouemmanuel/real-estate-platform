import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";

import { authService } from "@/services";

import { ResetPasswordForm } from "./ResetPasswordForm";
import { RecoveryLink } from "./RecoveryLink";

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

  it("keeps a scrubbed fragment token through Strict Mode and submits it once", async () => {
    resetPassword.mockResolvedValue(undefined);
    window.history.replaceState(
      null,
      "",
      "/reset-password#token=one-time-link",
    );
    const user = userEvent.setup();
    render(
      <StrictMode>
        <RecoveryLink />
      </StrictMode>,
    );
    await screen.findByLabelText("New password");
    expect(window.location.hash).toBe("");
    expect(resetPassword).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("New password"), "NewPassword123");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "NewPassword123",
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));
    await waitFor(() => expect(resetPassword).toHaveBeenCalledTimes(1));
    expect(resetPassword).toHaveBeenCalledWith({
      token: "one-time-link",
      password: "NewPassword123",
    });
  });

  it("does not consume or send a recovery token while displaying the form", () => {
    render(<ResetPasswordForm token="one-time-token" />);
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(validateResetToken).not.toHaveBeenCalled();
  });
  it("shows a server rejection without claiming the reset succeeded", async () => {
    resetPassword.mockRejectedValue(
      new Error("This reset link is invalid or expired"),
    );
    const user = userEvent.setup();
    render(<ResetPasswordForm token="expired-token" />);
    await user.type(screen.getByLabelText("New password"), "NewPassword123");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "NewPassword123",
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));
    expect(
      await screen.findByText("This reset link is invalid or expired"),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
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

/** Security regression guard — see the equivalent test in LoginForm.test.tsx
 *  for why `method="post"` matters (pre-hydration native submits default to
 *  GET and would put form fields in the URL). */
it("submits as POST so a pre-hydration native submit cannot put fields in the URL", async () => {
  // The form only renders once the token validates, so this has to wait for it
  // the same way the other tests in this file do.
  validateResetToken.mockResolvedValue({ valid: true, expired: false });
  const { container } = render(<ResetPasswordForm token="valid-token" />);

  await screen.findByLabelText("New password");
  expect(container.querySelector("form")).toHaveAttribute("method", "post");
});
