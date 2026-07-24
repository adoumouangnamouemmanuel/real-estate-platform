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

  test("Developer profile page has no automatically detectable WCAG violations", async ({
    page,
  }) => {
    await page.goto("/developers");
    await page.waitForLoadState("networkidle");
    await page.locator("a[href^='/developers/']").first().click();
    const developerHeading = await page
      .getByRole("heading", { level: 1 })
      .textContent();
    await expect(page).toHaveTitle(new RegExp(escapeRegExp(developerHeading!)));
    await page.waitForLoadState("networkidle");

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
