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
});
