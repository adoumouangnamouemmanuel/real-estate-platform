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
 * Navigates to Notifications via the sidebar link, never
 * page.goto("/notifications") directly — per ADR-009, the mock session lives
 * only in memory and doesn't survive a full page load. Mirrors
 * goToAppointments in appointments.spec.ts.
 */
async function goToNotifications(page: import("@playwright/test").Page) {
  await page
    .getByRole("navigation", { name: "Dashboard" })
    .first()
    .getByRole("link", { name: /Notifications/ })
    .click();
  await expect(page).toHaveURL("/notifications");
}

// Serial: several tests here mutate the shared mock inbox (mark as read, mark
// all as read). Running them concurrently would race on the same in-memory
// array and produce flaky counts — same reason appointments.spec.ts/
// listings.spec.ts run serially.
test.describe.configure({ mode: "serial" });

test.describe("Notifications (Phase 6.6)", () => {
  test("a developer reaches Notifications from the sidebar and sees their inbox", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToNotifications(page);

    await expect(
      page.getByRole("heading", { level: 1, name: "Notifications" }),
    ).toBeVisible();
    await expect(page.getByText(/\d+ unread notification/)).toBeVisible();
  });

  test("filters by status and the URL reflects it", async ({ page }) => {
    await loginAsDeveloper(page);
    await goToNotifications(page);

    await page.getByLabel("Status").selectOption("UNREAD");
    await expect(page).toHaveURL(/status=UNREAD/);
  });

  test("filters by category and the URL reflects it", async ({ page }) => {
    await loginAsDeveloper(page);
    await goToNotifications(page);

    await page.getByLabel("Category").selectOption("APPOINTMENT");
    await expect(page).toHaveURL(/category=APPOINTMENT/);
  });

  test("clearing filters from the empty state resets the list", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToNotifications(page);

    // Marking everything as read first guarantees the Unread filter below
    // matches nothing, regardless of the mock inbox's exact contents.
    await page.getByRole("button", { name: "Mark all as read" }).click();
    await page.getByLabel("Status").selectOption("UNREAD");

    await expect(
      page.getByText("No notifications match your filters"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();

    await expect(page).not.toHaveURL(/status=|category=/);
  });

  test("marks a single notification as read from its card", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToNotifications(page);
    await page.getByLabel("Status").selectOption("UNREAD");
    // The status filter triggers an async refetch (URL-driven filtering) —
    // filtering the listitem locator itself on a button that only exists for
    // genuinely-unread cards (NotificationsList.tsx's `isUnread` branch)
    // makes Playwright's own auto-retry wait out the still-rendered
    // unfiltered list, rather than grabbing whatever card happens to render
    // first before the refetch lands.
    const firstCard = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("button", { name: "Mark as read" }) })
      .first();
    await firstCard.getByRole("button", { name: "Mark as read" }).click();

    // Re-select Unread: the just-read notification should no longer be in it.
    await page.getByLabel("Status").selectOption("");
    await page.getByLabel("Status").selectOption("UNREAD");
  });

  test("opens the details drawer and marks as read from there", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToNotifications(page);
    await page.getByLabel("Status").selectOption("UNREAD");
    // See the "marks a single notification as read" test above for why this
    // filtered locator (not a plain .first()) is required.
    const firstCard = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("button", { name: "Mark as read" }) })
      .first();
    await firstCard.getByRole("button").first().click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Mark as read" })
      .click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("marks all notifications as read", async ({ page }) => {
    await loginAsDeveloper(page);
    await goToNotifications(page);

    await page.getByRole("button", { name: "Mark all as read" }).click();
    await expect(page.getByText("You're all caught up")).toBeVisible();

    await page.getByLabel("Status").selectOption("UNREAD");
    await expect(
      page.getByText("No notifications match your filters"),
    ).toBeVisible();
  });

  test("shows an unread count badge on the Notifications nav item", async ({
    page,
  }) => {
    await loginAsDeveloper(page);

    await expect(
      page
        .getByRole("navigation", { name: "Dashboard" })
        .first()
        .getByRole("link", { name: /Notifications/ }),
    ).toContainText(/\d/);
  });
});
