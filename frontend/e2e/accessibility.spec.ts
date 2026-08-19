import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Automated WCAG scanning via axe-core. This catches machine-detectable issues
 * (missing alt text, contrast, form labeling, ARIA misuse) — it complements, not
 * replaces, the manual keyboard/screen-reader review in the accessibility report.
 */
test.describe("Accessibility (axe)", () => {
  const pages: { name: string; path: string }[] = [
    { name: "Homepage", path: "/" },
    { name: "Property listing", path: "/properties" },
    { name: "Developer listing", path: "/developers" },
    { name: "Search results", path: "/search?q=Accra" },
    // Scanned in its empty state — a fresh browser context has nothing saved.
    // The populated state is covered by saved-properties.spec.ts.
    { name: "Saved properties", path: "/saved" },
    { name: "Login", path: "/login" },
    { name: "Registration", path: "/register" },
    { name: "Forgot password", path: "/forgot-password" },
    {
      name: "Reset password (valid token)",
      path: "/reset-password?token=valid-token-demo",
    },
    {
      name: "Reset password (expired token)",
      path: "/reset-password?token=expired-token-demo",
    },
    { name: "Unauthorized", path: "/unauthorized" },
    { name: "Forbidden", path: "/forbidden" },
  ];

  for (const { name, path } of pages) {
    test(`${name} has no automatically detectable WCAG violations`, async ({
      page,
    }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      expect(
        results.violations,
        JSON.stringify(results.violations, null, 2),
      ).toEqual([]);
    });
  }

  test("Property detail page has no automatically detectable WCAG violations", async ({
    page,
  }) => {
    await page.goto("/properties");
    await page.waitForLoadState("networkidle");
    await page.locator("a[href^='/properties/']").first().click();
    // Client-side navigation (Next.js Link) doesn't fire a full page load —
    // .click() only waits for the click action itself, not for the resulting
    // navigation. Without waiting for the URL to actually change first, the
    // heading read below can still be racing the /properties listing page's
    // own content (or the previous property's), not the destination page's —
    // exactly what was happening here (this is a real, deterministic browser
    // signal, not an arbitrary sleep).
    await page.waitForURL(/\/properties\/[^/]+$/);
    // generateMetadata is async (awaits the mock service), so the new page's
    // <title> commits after networkidle. Wait for it to actually contain this
    // property's heading — a plain non-empty check can pass on the *previous*
    // page's still-present title before the transition finishes.
    const propertyHeading = await page
      .getByRole("heading", { level: 1 })
      .textContent();
    await expect(page).toHaveTitle(new RegExp(escapeRegExp(propertyHeading!)));
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });

  test("Dashboard has no automatically detectable WCAG violations", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").pressSequentially("developer@byte.africa");
    await page
      .getByLabel("Password", { exact: true })
      .pressSequentially("Password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/dashboard");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });

  test("My Properties has no automatically detectable WCAG violations", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").pressSequentially("developer@byte.africa");
    await page
      .getByLabel("Password", { exact: true })
      .pressSequentially("Password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/dashboard");

    await page
      .getByRole("navigation", { name: "Dashboard" })
      .first()
      .getByRole("link", { name: "My Properties" })
      .click();
    await expect(page).toHaveURL("/listings");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });

  test("Appointments has no automatically detectable WCAG violations", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").pressSequentially("developer@byte.africa");
    await page
      .getByLabel("Password", { exact: true })
      .pressSequentially("Password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/dashboard");

    await page
      .getByRole("navigation", { name: "Dashboard" })
      .first()
      .getByRole("link", { name: "Appointments" })
      .click();
    await expect(page).toHaveURL("/appointments");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });

  test("Notifications has no automatically detectable WCAG violations", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").pressSequentially("developer@byte.africa");
    await page
      .getByLabel("Password", { exact: true })
      .pressSequentially("Password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/dashboard");

    await page
      .getByRole("navigation", { name: "Dashboard" })
      .first()
      .getByRole("link", { name: /Notifications/ })
      .click();
    await expect(page).toHaveURL("/notifications");
    await page.waitForLoadState("networkidle");
    // The notification list's stagger-in entrance (MotionRevealItem) means a
    // card can still be mid-fade right after networkidle; axe computes
    // contrast from the element's current (partially-transparent) blended
    // color at that instant, which reads as a false low-contrast violation
    // that doesn't exist once the reveal settles. Confirmed by comparing
    // scans with and without this wait — only the mid-animation scan flags
    // anything. Give the ~600ms reveal (lib/motion.ts DURATION_SLOW) time to
    // finish before scanning the settled page.
    await page.waitForTimeout(1000);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });

  test("Analytics has no automatically detectable WCAG violations", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").pressSequentially("developer@byte.africa");
    await page
      .getByLabel("Password", { exact: true })
      .pressSequentially("Password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/dashboard");

    await page
      .getByRole("navigation", { name: "Dashboard" })
      .first()
      .getByRole("link", { name: /Analytics/ })
      .click();
    await expect(page).toHaveURL("/analytics");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });

  test("Add Property (the Property Editor) has no automatically detectable WCAG violations", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").pressSequentially("developer@byte.africa");
    await page
      .getByLabel("Password", { exact: true })
      .pressSequentially("Password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/dashboard");

    await page
      .getByRole("navigation", { name: "Dashboard" })
      .first()
      .getByRole("link", { name: "My Properties" })
      .click();
    await page.getByRole("link", { name: "Add Property" }).click();
    await expect(page).toHaveURL("/listings/new");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });

  test("Developer profile page has no automatically detectable WCAG violations", async ({
    page,
  }) => {
    await page.goto("/developers");
    await page.waitForLoadState("networkidle");
    await page.locator("a[href^='/developers/']").first().click();
    // See the Property detail test above for why this wait is required —
    // identical race, same fix.
    await page.waitForURL(/\/developers\/[^/]+$/);
    const developerHeading = await page
      .getByRole("heading", { level: 1 })
      .textContent();
    await expect(page).toHaveTitle(new RegExp(escapeRegExp(developerHeading!)));
    await page.waitForLoadState("networkidle");
    // Same mid-fade false positive documented on the Notifications scan above.
    // Measured directly on this page: the offending elements' colour is a
    // constant lab(48.496) (#737373 — 4.6:1 on white, which passes), but their
    // effective opacity is 0.672 at 150ms and only reaches 1.0 around 900ms.
    // Axe blends that partial opacity against white and reports #7c7c7c at
    // 4.17:1 — a violation of a state no settled page ever shows. Without this
    // wait the scan failed 4 runs in 5. Let the reveal finish, then scan.
    await page.waitForTimeout(1000);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });

  test("homepage search input is keyboard-operable end to end", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByLabel("Search by city, neighborhood, or property name")
      .focus();
    await page.keyboard.type("Accra");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/search\?q=Accra/);
  });

  test("login form is fully keyboard-operable: tab order, submit via Enter", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByLabel("Email").focus();
    await page.keyboard.type("demo@byte.africa");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
    await page.keyboard.type("Password123");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL("/");
  });

  test("password visibility toggle has an accessible name and reflects its pressed state", async ({
    page,
  }) => {
    await page.goto("/login");

    const toggle = page.getByRole("button", { name: "Show password" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.click();
    await expect(
      page.getByRole("button", { name: "Hide password" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
