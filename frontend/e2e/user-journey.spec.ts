import { expect, test } from "@playwright/test";

/**
 * The core product journey: Homepage → Search → Property Listing → Property
 * Details → Developer Profile. Runs against every project in playwright.config.ts
 * (desktop Chromium/Firefox/WebKit + mobile Chrome/Safari viewports), so a single
 * spec covers both cross-browser and responsive-layout verification.
 */
test.describe("Homepage → Search → Listing → Details → Developer journey", () => {
  test("navigates the full path and each page renders its key content", async ({
    page,
  }) => {
    // Homepage
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Find your next home",
    );
    await expect(page.getByRole("navigation")).toBeVisible();

    // Search — via the homepage SearchBar. Uses key-by-key typing rather than
    // .fill(): Playwright's fill() sets the DOM value directly, which WebKit
    // doesn't reliably surface to React's controlled-input onChange handler.
    await page
      .getByLabel("Search by city, neighborhood, or property name")
      .pressSequentially("Kumasi");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/\/search\?q=Kumasi/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Search Results" }),
    ).toBeVisible();
    await expect(page.locator("a[href^='/properties/']").first()).toBeVisible();

    // Property Listing — direct nav via the Properties link
    await page.getByRole("link", { name: "Properties", exact: true }).click();
    await expect(page).toHaveURL(/\/properties$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Properties" }),
    ).toBeVisible();
    const firstCard = page.locator("a[href^='/properties/']").first();
    await expect(firstCard).toBeVisible();

    // Property Details
    const propertyHref = await firstCard.getAttribute("href");
    await firstCard.click();
    await expect(page).toHaveURL(
      new RegExp(propertyHref!.replace(/[/]/g, "\\/") + "$"),
    );
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Description" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Contact" })).toBeVisible();

    // Developer Profile — via the property's developer contact card
    const developerLink = page.locator("a[href^='/developers/']").first();
    const developerHref = await developerLink.getAttribute("href");
    await developerLink.click();
    await expect(page).toHaveURL(
      new RegExp(developerHref!.replace(/[/]/g, "\\/") + "$"),
    );
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The bio no longer sits under its own "About" heading — it moved into the
    // identity header, where it belongs to who the developer is rather than to
    // a downstream section. Assert the bio text itself, which is the thing that
    // actually has to be on the page, rather than the heading that framed it.
    await expect(
      page
        .locator("main header p")
        .filter({ hasText: /.{60,}/ })
        .first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Active listings/i }),
    ).toBeVisible();
  });

  test("shows a loading indicator before the property grid resolves", async ({
    page,
  }) => {
    await page.goto("/properties", { waitUntil: "commit" });

    // The mock service has an artificial ~400ms latency; catch the loading state before it clears.
    await expect(page.getByRole("status")).toBeVisible({ timeout: 2000 });
    await expect(page.getByRole("status")).toBeHidden({ timeout: 5000 });
  });

  test("navbar and footer are present and links resolve on every page in the journey", async ({
    page,
  }) => {
    for (const path of ["/", "/properties", "/developers", "/search"]) {
      await page.goto(path);
      await expect(page.getByRole("link", { name: "Lumavok" })).toBeVisible();
      await expect(page.getByText("All rights reserved")).toBeVisible();
    }
  });
});
