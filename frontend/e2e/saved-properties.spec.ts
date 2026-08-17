import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Saved Properties, end to end. Favourites are browser-scoped localStorage
 * (services/favorite.service.ts), so each test starts from a fresh context with
 * nothing saved — no shared mutable module state to serialize around, unlike
 * the listings/appointments specs.
 */
test.describe("Saved properties", () => {
  test("starts empty and offers a route back to browsing", async ({ page }) => {
    await page.goto("/saved");

    await expect(
      page.getByRole("heading", { name: "Saved Properties" }),
    ).toBeVisible();
    await expect(page.getByText("Nothing saved yet")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Browse properties/ }),
    ).toBeVisible();
  });

  test("saving a property from the catalogue makes it retrievable, and unsaving removes it", async ({
    page,
  }) => {
    await page.goto("/properties");
    await page.waitForLoadState("networkidle");

    const firstCard = page.locator("article").first();
    const title = (await firstCard.locator("p").first().innerText()).trim();

    await firstCard.getByRole("button", { name: /^Save / }).click();
    // The heart is optimistic (useToggleFavorite) — wait for the toggled
    // accessible name rather than a fixed timeout.
    await expect(
      firstCard.getByRole("button", { name: /from saved properties$/ }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Saved", exact: true }).click();
    await expect(page).toHaveURL("/saved");
    await expect(page.getByText(title, { exact: true })).toBeVisible();
    await expect(page.getByText(/stored in this browser only/i)).toBeVisible();

    await page
      .getByRole("button", { name: `Remove ${title} from saved properties` })
      .click();

    await expect(page.getByText("Nothing saved yet")).toBeVisible();
  });

  test("the populated list has no automatically detectable WCAG violations", async ({
    page,
  }) => {
    await page.goto("/properties");
    await page.waitForLoadState("networkidle");
    await page
      .locator("article")
      .first()
      .getByRole("button", { name: /^Save / })
      .click();

    await page.goto("/saved");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("article").first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });
});

test.describe("Public navigation active state", () => {
  test("marks the current section, including on a nested route", async ({
    page,
  }) => {
    await page.goto("/properties");
    await expect(
      page.getByRole("link", { name: "Properties", exact: true }),
    ).toHaveAttribute("aria-current", "page");

    await page.locator("a[href^='/properties/']").first().click();
    await page.waitForURL(/\/properties\/.+/);
    await expect(
      page.getByRole("link", { name: "Properties", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  });
});

test.describe("Property contact path", () => {
  test("a property detail page routes to the developer's contact section", async ({
    page,
  }) => {
    await page.goto("/properties");
    await page.waitForLoadState("networkidle");
    await page.locator("a[href^='/properties/']").first().click();
    await page.waitForURL(/\/properties\/.+/);

    const contact = page.getByRole("link", { name: /^Contact / });
    await expect(contact).toBeVisible();
    await contact.click();

    await page.waitForURL(/\/developers\/.+#contact/);

    // `toBeInViewport`, deliberately not `toBeVisible`: this route has its own
    // loading.tsx, so Next's hash scroll fires while the loading UI is mounted
    // and #contact doesn't exist yet — the section rendered fine but the page
    // stayed at the top, and a `toBeVisible` assertion passed straight over it.
    // ScrollToHash is what makes this land; this is the assertion that proves it.
    await expect(page.locator("#contact")).toBeInViewport();
    await expect(
      page.locator("#contact a[href^='mailto:']").first(),
    ).toBeInViewport();
  });
});
