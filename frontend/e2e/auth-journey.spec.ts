import { expect, test } from "@playwright/test";

/**
 * Uses .pressSequentially() rather than .fill() for every text field — Playwright's
 * .fill() doesn't reliably trigger React's controlled-input onChange in WebKit (see
 * ADR-008), and this suite runs against WebKit/mobile-Safari projects too.
 */
test.describe("Login", () => {
  test("rejects the wrong password with a generic message, then succeeds with the right one", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByLabel("Email").pressSequentially("demo@byte.africa");
    await page
      .getByLabel("Password", { exact: true })
      .pressSequentially("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Invalid email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel("Password", { exact: true }).fill("");
    await page
      .getByLabel("Password", { exact: true })
      .pressSequentially("Password123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/");
    // The user's name is hidden below the sm breakpoint (see NavbarAuthSection), so
    // assert on the always-visible "Log out" button rather than the name text.
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  });

  test("the password visibility toggle switches the input type", async ({
    page,
  }) => {
    await page.goto("/login");
    const passwordInput = page.getByLabel("Password", { exact: true });

    await expect(passwordInput).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(passwordInput).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  // "Already-authenticated visitor redirected away from /login" is intentionally not
  // an E2E test: reaching /login while authenticated, in this mock environment, requires
  // a client-side (no full reload) navigation there, but there's no real UI affordance
  // for it once logged in (the Navbar hides the "Log in" link). page.goto() always does
  // a full navigation, which resets the mock session per the documented cookie
  // limitation — so it can't reproduce the scenario it's meant to test. Covered instead
  // by RedirectIfAuthenticated.test.tsx (mocked store, 3 tests).
});

test.describe("Registration", () => {
  test("blocks submission until passwords match and terms are accepted, then succeeds", async ({
    page,
  }) => {
    const uniqueEmail = `new-user-${Date.now()}@example.com`;
    await page.goto("/register");

    await page.getByLabel("Full name").pressSequentially("Kwame Mensah");
    await page
      .getByLabel("Email", { exact: true })
      .pressSequentially(uniqueEmail);
    await page
      .getByLabel("Password", { exact: true })
      .pressSequentially("Password123");
    await page
      .getByLabel("Confirm password", { exact: true })
      .pressSequentially("Mismatch123");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Passwords don't match.")).toBeVisible();
    await expect(page).toHaveURL(/\/register/);

    await page.getByLabel("Confirm password", { exact: true }).fill("");
    await page
      .getByLabel("Confirm password", { exact: true })
      .pressSequentially("Password123");
    await page.getByRole("button", { name: "Create account" }).click();

    // Still blocked — terms not yet accepted.
    await expect(
      page.getByText(
        "You must accept the Terms of Service and Privacy Policy.",
      ),
    ).toBeVisible();

    await page.getByLabel(/I agree to the Terms/).check();
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL("/");
    // The user's name is hidden below the sm breakpoint (see NavbarAuthSection), so
    // assert on the always-visible "Log out" button rather than the name text.
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  });

  test("rejects registering with an email that already has an account", async ({
    page,
  }) => {
    await page.goto("/register");

    await page.getByLabel("Full name").pressSequentially("Demo User");
    await page
      .getByLabel("Email", { exact: true })
      .pressSequentially("demo@byte.africa");
    await page
      .getByLabel("Password", { exact: true })
      .pressSequentially("Password123");
    await page
      .getByLabel("Confirm password", { exact: true })
      .pressSequentially("Password123");
    await page.getByLabel(/I agree to the Terms/).check();
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(
      page.getByText("An account with this email already exists."),
    ).toBeVisible();
  });
});

test.describe("Forgot / reset password", () => {
  test("forgot-password always shows the same confirmation", async ({
    page,
  }) => {
    await page.goto("/forgot-password");

    await page
      .getByLabel("Email")
      .pressSequentially("nobody-at-all@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(page.getByText("Check your email")).toBeVisible();
  });

  test("an expired reset token shows the expired-link state, not the form", async ({
    page,
  }) => {
    await page.goto("/reset-password?token=expired-token-demo");

    await expect(page.getByText("This link has expired")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Request new link" }),
    ).toHaveAttribute("href", "/forgot-password");
  });

  test("a missing token shows the invalid-link state immediately", async ({
    page,
  }) => {
    await page.goto("/reset-password");

    await expect(page.getByText("This link is invalid")).toBeVisible();
  });

  test("a valid token allows setting a new password, which then works to log in", async ({
    page,
  }) => {
    await page.goto("/reset-password?token=valid-token-demo");

    await page
      .getByLabel("New password", { exact: true })
      .pressSequentially("FreshPassword1");
    await page
      .getByLabel("Confirm new password", { exact: true })
      .pressSequentially("FreshPassword1");
    await page.getByRole("button", { name: "Reset password" }).click();

    await expect(page).toHaveURL(/\/login\?reset=success/);
    await expect(
      page.getByText(
        "Your password has been reset. Sign in with your new password.",
      ),
    ).toBeVisible();

    await page.getByLabel("Email").pressSequentially("demo@byte.africa");
    await page
      .getByLabel("Password", { exact: true })
      .pressSequentially("FreshPassword1");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/");
  });
});

test.describe("Logout", () => {
  test("logs out from the Navbar and returns to an anonymous state", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").pressSequentially("demo@byte.africa");
    await page
      .getByLabel("Password", { exact: true })
      .pressSequentially("Password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    // The user's name is hidden below the sm breakpoint (see NavbarAuthSection), so
    // assert on the always-visible "Log out" button rather than the name text.
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();

    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log out" })).toHaveCount(0);
  });
});
