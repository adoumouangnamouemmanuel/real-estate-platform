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

/**
 * The security property behind `method="post"` on the auth forms.
 *
 * React's onSubmit handler only exists after hydration. A submit before then is
 * handled natively by the browser, and a form with no `method` defaults to GET —
 * appending every named field to the URL. That was reproduced on the running
 * app: an early submit navigated to `/login?email=…&password=Password123`,
 * putting the password into browser history, server logs, and the Referer
 * header of the next request.
 *
 * Blocking scripts is a deterministic stand-in for "the user submitted before
 * the JS finished loading" — otherwise this is a race that only shows up on a
 * slow connection. With scripts blocked React never hydrates, so the native
 * path is guaranteed to be the one exercised.
 */
test.describe("Pre-hydration form safety", () => {
  const CREDENTIAL = "Password123";

  test("a login submitted before hydration cannot put the password in the URL", async ({
    page,
  }) => {
    await page.route("**/*.js", (route) => route.abort());
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    await page.locator('input[type="email"]').fill("developer@byte.africa");
    await page.locator('input[type="password"]').fill(CREDENTIAL);

    // requestSubmit() goes through the browser's own submit path, which is
    // exactly what an un-hydrated page does.
    await page
      .locator("form")
      .first()
      .evaluate((form: HTMLFormElement) => {
        form.requestSubmit();
      });
    await page.waitForLoadState("domcontentloaded");

    expect(page.url()).not.toContain(CREDENTIAL);
    expect(page.url()).not.toContain("password=");
    expect(page.url()).not.toContain("email=");
  });

  test("the same holds for register, forgot-password and reset-password", async ({
    page,
  }) => {
    for (const path of [
      "/register",
      "/forgot-password",
      "/reset-password?token=valid-token-demo",
    ]) {
      await page.route("**/*.js", (route) => route.abort());
      await page.goto(path, { waitUntil: "domcontentloaded" });

      const form = page.locator("form").first();
      // reset-password renders its form only after the token resolves, which
      // needs JS — so with scripts blocked there is nothing to submit there.
      // Assert the method on whatever form the server did render.
      if (await form.count()) {
        await expect(form).toHaveAttribute("method", "post");
      }
      await page.unroute("**/*.js");
    }
  });
});
