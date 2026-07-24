import { expect, test } from "@playwright/test";

/**
 * A minimal valid 1x1 PNG, used as a stand-in upload file — Playwright's
 * setInputFiles accepts an in-memory buffer directly, no fixture file on disk.
 */
const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

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

/**
 * Navigates via the sidebar/UI, never page.goto() to a protected route — see
 * the same note in listings.spec.ts (ADR-009: the mock session lives only in
 * memory and doesn't survive a full page load).
 */
async function goToMyProperties(page: import("@playwright/test").Page) {
  await page
    .getByRole("navigation", { name: "Dashboard" })
    .first()
    .getByRole("link", { name: "My Properties" })
    .click();
  await expect(page).toHaveURL("/listings");
}

async function fillRequiredFields(page: import("@playwright/test").Page) {
  await page.getByLabel("Title").fill("Playwright Test Listing");
  await page.getByLabel("Description").fill("A lovely place to test.");
  await page.getByLabel("Category").selectOption("apartment");
  await page.getByLabel("Listing type").selectOption("SALE");
  await page.getByLabel("City").selectOption("Accra");
  await page.getByLabel("Region").fill("Greater Accra");
  await page.getByLabel("Address").fill("1 Test Street");
  await page.getByLabel("Price").fill("250000");
  await page.setInputFiles("#listing-media-input", {
    name: "photo.png",
    mimeType: "image/png",
    buffer: ONE_PIXEL_PNG,
  });
  // Exact match: Playwright's getByText does case-insensitive substring
  // matching by default, and the section's own description ("...the cover
  // image.") would otherwise satisfy this before any upload actually finishes.
  await expect(page.getByText("Cover", { exact: true })).toBeVisible();
}

// Serial: every test here creates/publishes/deletes a listing against the
// same shared in-memory mock store — same reasoning as listings.spec.ts.
test.describe.configure({ mode: "serial" });

test.describe("Property Editor (Phase 6.3)", () => {
  test("adding a property autosaves as a draft and adopts a real URL", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToMyProperties(page);
    await page.getByRole("link", { name: "Add Property" }).click();
    await expect(page).toHaveURL("/listings/new");

    await page.getByLabel("Title").fill("Autosave Test Listing");
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/listings\/.+\/edit/);
  });

  test("blocks Publish with a validation message when the listing is incomplete", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToMyProperties(page);
    await page.getByRole("link", { name: "Add Property" }).click();

    await page.getByLabel("Title").fill("Incomplete Listing");
    await page.getByRole("button", { name: "Publish" }).click();

    await expect(page.getByText(/before publishing/)).toBeVisible();
    await expect(page).toHaveURL("/listings/new");
  });

  test("publishes a complete listing and it appears active in My Properties", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToMyProperties(page);
    await page.getByRole("link", { name: "Add Property" }).click();

    await fillRequiredFields(page);
    await page.getByRole("button", { name: "Publish" }).click();

    await expect(page).toHaveURL("/listings");
    await page.getByLabel("Search").fill("Playwright Test Listing");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByRole("table")).toContainText("Active");
  });

  test("edits an existing draft, publishes it, then deletes a different draft", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToMyProperties(page);
    await page.getByLabel("Status", { exact: true }).selectOption("DRAFT");

    const firstRow = page.getByRole("row").nth(1);
    await firstRow.getByRole("button", { name: /Actions for/ }).click();
    await page.getByRole("menuitem", { name: "Edit listing" }).click();

    await expect(page).toHaveURL(/\/listings\/.+\/edit/);
    await page.getByRole("button", { name: "Delete" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete" })
      .click();

    await expect(page).toHaveURL("/listings");
    await expect(page.getByText("Listing deleted.")).toBeVisible();
  });

  test("a published listing uses explicit Save and guards navigation away from unsaved changes", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToMyProperties(page);
    await page.getByLabel("Status", { exact: true }).selectOption("ACTIVE");

    const firstRow = page.getByRole("row").nth(1);
    await firstRow.getByRole("button", { name: /Actions for/ }).click();
    await page.getByRole("menuitem", { name: "Edit listing" }).click();

    await expect(page).toHaveURL(/\/listings\/.+\/edit/);
    // Published listings show an explicit Save button, no autosave status text.
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toBeVisible();

    await page.getByLabel("Price").fill("999999");
    await page.getByRole("button", { name: "Back to My Properties" }).click();

    await expect(page.getByRole("dialog")).toContainText(
      /leave without saving/i,
    );
    await page.getByRole("button", { name: "Stay" }).click();
    await expect(page).not.toHaveURL("/listings");

    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Changes saved.")).toBeVisible();

    // No longer dirty after saving — Back now navigates immediately.
    await page.getByRole("button", { name: "Back to My Properties" }).click();
    await expect(page).toHaveURL("/listings");
  });
});
