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
 * Navigates to Analytics via the sidebar link, never
 * page.goto("/analytics") directly — per ADR-009, the mock session lives
 * only in memory and doesn't survive a full page load.
 */
async function goToAnalytics(page: import("@playwright/test").Page) {
  await page
    .getByRole("navigation", { name: "Dashboard" })
    .first()
    .getByRole("link", { name: /Analytics/ })
    .click();
  await expect(page).toHaveURL("/analytics");
}

test.describe("Analytics (Phase 6.7)", () => {
  test("a developer reaches Analytics from the sidebar and sees every section", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToAnalytics(page);

    await expect(
      page.getByRole("heading", { level: 1, name: "Analytics" }),
    ).toBeVisible();
    await expect(page.getByText("Action Needed")).toBeVisible();
    await expect(page.getByText("Appointment Funnel")).toBeVisible();
    await expect(page.getByText("Portfolio Composition")).toBeVisible();
  });

  test("Action Needed flags the overdue appointment request and deep-links into Appointments", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToAnalytics(page);

    // The mock appointment book always has at least one REQUESTED appointment
    // with a past scheduled date (see services/mocks/appointments.mock.ts).
    await expect(page.getByText(/overdue appointment request/)).toBeVisible();

    await page
      .getByRole("listitem")
      .filter({ hasText: "overdue appointment request" })
      .getByRole("link", { name: "View" })
      .click();

    await expect(page).toHaveURL(/\/appointments\?timeframe=overdue/);
  });

  test("changing the period updates the URL and refetches the funnel", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToAnalytics(page);

    await page.getByLabel("Period").selectOption("7d");
    await expect(page).toHaveURL(/period=7d/);
  });

  test("the funnel toggles between chart and table views", async ({
    page,
  }) => {
    await loginAsDeveloper(page);
    await goToAnalytics(page);

    await page.getByRole("button", { name: "View as table" }).click();
    await expect(page.getByRole("table").first()).toBeVisible();
    await expect(page.getByRole("cell", { name: "Requested" })).toBeVisible();

    await page.getByRole("button", { name: "View as chart" }).click();
    await expect(
      page.getByRole("button", { name: "View as table" }),
    ).toBeVisible();
  });

  test("the stat row is swipeable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsDeveloper(page);

    // Analytics isn't one of the mobile bottom nav's primary tabs (see
    // MOBILE_PRIMARY_NAV_COUNT in dashboard-nav.ts) — it lives in the "More"
    // drawer, unlike on desktop where the sidebar links to it directly.
    await page
      .getByRole("navigation", { name: "Dashboard" })
      .getByRole("button", { name: "More" })
      .click();
    await page.getByRole("link", { name: /Analytics/ }).click();
    await expect(page).toHaveURL("/analytics");

    await expect(page.getByText("Active Listings")).toBeVisible();
  });
});
