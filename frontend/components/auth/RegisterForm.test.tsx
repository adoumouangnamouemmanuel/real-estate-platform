import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authService } from "@/services";
import { useAuthStore } from "@/store/authStore";

import { RegisterForm } from "./RegisterForm";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return { ...actual, authService: { register: vi.fn() } };
});

const register = vi.mocked(authService.register);

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Full name"), "Ama Boateng");
  await user.type(
    screen.getByLabelText("Email", { exact: true }),
    "ama@example.com",
  );
  await user.type(
    screen.getByLabelText("Password", { exact: true }),
    "Password123",
  );
  await user.type(
    screen.getByLabelText("Confirm password", { exact: true }),
    "Password123",
  );
}

describe("RegisterForm", () => {
  beforeEach(() => {
    push.mockClear();
    register.mockReset();
    useAuthStore.getState().clearAuth();
  });

  it("blocks submission when the terms checkbox isn't checked", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText(
        "You must accept the Terms of Service and Privacy Policy.",
      ),
    ).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("blocks submission when passwords don't match", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Full name"), "Ama Boateng");
    await user.type(
      screen.getByLabelText("Email", { exact: true }),
      "ama@example.com",
    );
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "Password123",
    );
    await user.type(
      screen.getByLabelText("Confirm password", { exact: true }),
      "Different123",
    );
    await user.click(screen.getByLabelText(/I agree to the Terms/));
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Passwords don't match."),
    ).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("shows the password mismatch error even when the terms checkbox is also unchecked", async () => {
    // Regression test: Zod's .refine() only runs after every other field validates,
    // so chaining the match check onto the schema hid it behind the acceptTerms error
    // until a second submit — caught via Playwright, fixed with withPasswordMatchResolver.
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Full name"), "Ama Boateng");
    await user.type(
      screen.getByLabelText("Email", { exact: true }),
      "ama@example.com",
    );
    await user.type(
      screen.getByLabelText("Password", { exact: true }),
      "Password123",
    );
    await user.type(
      screen.getByLabelText("Confirm password", { exact: true }),
      "Different123",
    );
    // Deliberately leave the terms checkbox unchecked.
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Passwords don't match."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "You must accept the Terms of Service and Privacy Policy.",
      ),
    ).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("shows the service's error message on a duplicate email", async () => {
    const user = userEvent.setup();
    register.mockRejectedValue(
      new Error("An account with this email already exists."),
    );
    render(<RegisterForm />);

    await fillValidForm(user);
    await user.click(screen.getByLabelText(/I agree to the Terms/));
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("An account with this email already exists."),
    ).toBeInTheDocument();
  });

  it("registers, authenticates, and redirects by role on success", async () => {
    const user = userEvent.setup();
    register.mockResolvedValue({
      user: {
        id: "u2",
        fullName: "Ama Boateng",
        email: "ama@example.com",
        role: "USER",
      },
      accessToken: "token",
    });
    render(<RegisterForm />);

    await fillValidForm(user);
    await user.click(screen.getByLabelText(/I agree to the Terms/));
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });
});

/** Security regression guard — see the equivalent test in LoginForm.test.tsx
 *  for why `method="post"` matters (pre-hydration native submits default to
 *  GET and would put form fields in the URL). */
it("submits as POST so a pre-hydration native submit cannot put fields in the URL", () => {
  const { container } = render(<RegisterForm />);
  expect(container.querySelector("form")).toHaveAttribute("method", "post");
});
