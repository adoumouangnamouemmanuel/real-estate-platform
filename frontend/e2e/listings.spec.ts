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

/**
 * Navigates to My Properties via the sidebar link, never page.goto("/listings")
 * directly — per ADR-009, the mock session lives only in memory and doesn't
 * survive a full page load, so a direct goto to a protected route lands on the
 * sign-in-required fallback even with the mock cookie present. Every other
 * dashboard e2e spec follows this same click-through convention.
 */
async function goToMyProperties(page: import("@playwright/test").Page) {
  await page
    .getByRole("navigation", { name: "Dashboard" })
    .first()
    .getByRole("link", { name: "My Properties" })
    .click();
  await expect(page).toHaveURL("/listings");
}

// Serial: several tests here mutate the shared mock portfolio (publish, delete,
// bulk actions). Running them concurrently would race on the same in-memory
// array and produce flaky row counts — same reason the mutation tests in
// listing.service.test.ts snapshot/restore around each other.
test.describe.configure({ mode: "serial" });

test.describe("My Properties (Phase 6.2)", () => {
  test("a developer reaches My Properties from the sidebar and sees their portfolio", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToMyProperties(page);

    await expect(
      page.getByRole("heading", { level: 1, name: "My Properties" }),
    ).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("filters by status and the URL reflects it", async ({ page }) => {
    await loginAsDeveloper(page);
    await goToMyProperties(page);

    await page.getByLabel("Status", { exact: true }).selectOption("DRAFT");
    await expect(page).toHaveURL(/status=DRAFT/);
    await expect(page.getByRole("table")).toContainText("Draft");
  });

  test("searching for a keyword narrows the table", async ({ page }) => {
    await loginAsDeveloper(page);
    await goToMyProperties(page);

    await page.getByLabel("Search").fill("Kumasi");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page).toHaveURL(/q=Kumasi/);
    await expect(page.getByRole("table")).toContainText("Kumasi");
  });

  test("clearing filters from the empty state resets the table", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToMyProperties(page);

    await page.getByLabel("Search").fill("zzz-no-such-listing-zzz");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(
      page.getByText("No listings match your filters"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();

    await expect(page.getByRole("table")).toBeVisible();
    await expect(page).not.toHaveURL(/q=/);
  });

  test("publishes a draft listing from its row action menu", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToMyProperties(page);
    await page.getByLabel("Status", { exact: true }).selectOption("DRAFT");

    const firstRow = page.getByRole("row").nth(1);
    const titleCell = await firstRow.locator("td").nth(1).innerText();
    const title = titleCell.split("\n")[0];

    await firstRow.getByRole("button", { name: /Actions for/ }).click();
    await page.getByRole("menuitem", { name: "Publish" }).click();
    await expect(page.getByText(`"${title}" updated.`)).toBeVisible();

    // Re-select Draft: the just-published listing should no longer be in it.
    await page.getByLabel("Status", { exact: true }).selectOption("");
    await page.getByLabel("Status", { exact: true }).selectOption("DRAFT");
    await expect(page.getByRole("table")).not.toContainText(title);
  });

  test("deletes a draft listing after confirming", async ({ page }) => {
    await loginAsDeveloper(page);
    await goToMyProperties(page);
    await page.getByLabel("Status", { exact: true }).selectOption("DRAFT");
    await page.getByLabel("Rows per page").selectOption("50");

    const firstRow = page.getByRole("row").nth(1);
    const titleCell = await firstRow.locator("td").nth(1).innerText();
    const title = titleCell.split("\n")[0];

    await firstRow.getByRole("button", { name: /Actions for/ }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete" })
      .click();

    await expect(page.getByText("Listing deleted.")).toBeVisible();
    // Re-select Draft (forces a fresh fetch) and confirm the deleted title is gone.
    await page.getByLabel("Status", { exact: true }).selectOption("");
    await page.getByLabel("Status", { exact: true }).selectOption("DRAFT");
    await expect(page.getByRole("table")).not.toContainText(title);
  });

  test("cancelling a delete leaves the listing in place", async ({ page }) => {
    await loginAsDeveloper(page);
    await goToMyProperties(page);
    await page.getByLabel("Status", { exact: true }).selectOption("DRAFT");

    const firstRow = page.getByRole("row").nth(1);
    const titleCell = await firstRow.locator("td").nth(1).innerText();
    const title = titleCell.split("\n")[0];

    await firstRow.getByRole("button", { name: /Actions for/ }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cancel" })
      .click();

    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByRole("table")).toContainText(title);
  });

  test("selects rows and applies a bulk action", async ({ page }) => {
    await loginAsDeveloper(page);
    await goToMyProperties(page);
    await page.getByLabel("Status", { exact: true }).selectOption("DRAFT");
    await page.getByLabel("Rows per page").selectOption("50");

    await page.getByRole("row").nth(1).getByRole("checkbox").check();
    await expect(page.getByText("1 selected")).toBeVisible();

    await page.getByRole("button", { name: "Publish / Reopen" }).click();
    await expect(page.getByText("1 listing(s) updated.")).toBeVisible();
    await expect(page.getByText("1 selected")).not.toBeVisible();
  });

  test("the status summary chips filter the table and toggle off on a second click", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToMyProperties(page);

    await page.getByRole("button", { name: /^Draft/ }).click();
    await expect(page).toHaveURL(/status=DRAFT/);

    await page.getByRole("button", { name: /^Draft/ }).click();
    await expect(page).not.toHaveURL(/status=DRAFT/);
  });
});
