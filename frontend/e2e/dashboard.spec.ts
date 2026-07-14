import { expect, test } from "@playwright/test";

/**
 * Uses .pressSequentially() rather than .fill() for text fields — see ADR-008
 * (Playwright's .fill() doesn't reliably trigger React's controlled-input onChange
 * in WebKit).
 */
async function loginAsDeveloper(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").pressSequentially("developer@byte.africa");
  await page
    .getByLabel("Password", { exact: true })
    .pressSequentially("Password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/dashboard");
}

test.describe("Dashboard shell", () => {
  test("a developer lands on the dashboard after login and sees the shell chrome", async ({
    page,
  }) => {
    await loginAsDeveloper(page);

    await expect(
      page.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeVisible();
    await expect(page.getByText("Your dashboard is ready")).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Dashboard" })
        .first()
        .getByRole("link", { name: "Dashboard", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("not-yet-shipped nav destinations are visibly disabled, not broken links", async ({
    page,
  }) => {
    await loginAsDeveloper(page);

    const myProperties = page
      .getByRole("button", { name: /My Properties/ })
      .first();
    await expect(myProperties).toBeDisabled();
    // The "Soon" badge itself is only ever shown in the desktop sidebar's expanded
    // (lg+) state and the mobile "More" sheet — not the icon-only tablet rail or the
    // primary mobile tab bar — so assert presence in the DOM, not viewport-dependent
    // visibility.
    await expect(page.getByText("Soon").first()).toHaveCount(1);
  });

  test("the account menu shows the developer's identity and logs out cleanly", async ({
    page,
  }) => {
    await loginAsDeveloper(page);

    await page.getByLabel(/Account menu/).click();
    await expect(page.getByText("Kwame Mensah")).toBeVisible();
    await expect(page.getByText("DEVELOPER")).toBeVisible();

    await page.getByRole("menuitem", { name: "Log out" }).click();
    // Logging out from a RequireAuth-guarded page correctly bounces to
    // /unauthorized (no longer authorized for the page you were standing on).
    await expect(page).toHaveURL("/unauthorized");

    // The session cookie set at login is cleared on logout too — a fresh visit
    // to /dashboard is rejected by proxy.ts again, same as any anonymous visitor.
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login?redirect=%2Fdashboard");
  });

  test("the mobile bottom nav and its More sheet expose every destination", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsDeveloper(page);

    await expect(
      page.getByRole("navigation", { name: "Dashboard" }).getByRole("link", {
        name: "Dashboard",
        exact: true,
      }),
    ).toBeVisible();

    await page.getByRole("button", { name: "More" }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("Analytics")).toBeVisible();
    await expect(sheet.getByText("Notifications")).toBeVisible();
    await expect(sheet.getByText("Account Settings")).toBeVisible();
  });
});
