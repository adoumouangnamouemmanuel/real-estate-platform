import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authService } from "@/services";

import { ForgotPasswordForm } from "./ForgotPasswordForm";

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return { ...actual, authService: { requestPasswordReset: vi.fn() } };
});

const requestPasswordReset = vi.mocked(authService.requestPasswordReset);

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    requestPasswordReset.mockReset();
  });

  it("shows the same confirmation regardless of whether the email exists", async () => {
    const user = userEvent.setup();
    requestPasswordReset.mockResolvedValue(undefined);
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "anyone@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    expect(
      screen.getByText(/If an account exists for anyone@example\.com/),
    ).toBeInTheDocument();
  });

  it("validates the email format before submitting", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });
});

/** Security regression guard — see the equivalent test in LoginForm.test.tsx
 *  for why `method="post"` matters (pre-hydration native submits default to
 *  GET and would put form fields in the URL). */
it("submits as POST so a pre-hydration native submit cannot put fields in the URL", () => {
  const { container } = render(<ForgotPasswordForm />);
  expect(container.querySelector("form")).toHaveAttribute("method", "post");
});
