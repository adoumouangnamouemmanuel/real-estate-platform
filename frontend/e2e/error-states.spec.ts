import { expect, test } from "@playwright/test";

test.describe("Not-found handling", () => {
  test("an invalid property slug renders the styled 404, not a bare error page", async ({
    page,
  }) => {
    await page.goto("/properties/this-slug-does-not-exist");

    await expect(page.getByText("Page not found")).toBeVisible();
    // The (public) layout's chrome should still wrap the 404 — proves it's our
    // not-found.tsx, not Next's unstyled default.
    await expect(page.getByRole("link", { name: "Lumavok" })).toBeVisible();
    await expect(page.getByText("All rights reserved")).toBeVisible();
  });

  test("an invalid developer slug renders the styled 404", async ({ page }) => {
    await page.goto("/developers/this-slug-does-not-exist");

    await expect(page.getByText("Page not found")).toBeVisible();
    await expect(page.getByRole("link", { name: "Lumavok" })).toBeVisible();
  });

  test("the 404 page's 'Back to home' link returns to the homepage", async ({
    page,
  }) => {
    await page.goto("/properties/this-slug-does-not-exist");

    await page.getByRole("link", { name: "Back to home" }).click();

    await expect(page).toHaveURL("/");
  });

  test("a search with no matches shows the empty state, not an error", async ({
    page,
  }) => {
    await page.goto("/search?q=zzzz-no-such-listing-zzzz");

    await expect(page.getByText("No properties found")).toBeVisible();
    await expect(
      page.getByText("Try a different keyword or adjust your filters."),
    ).toBeVisible();
  });
});
