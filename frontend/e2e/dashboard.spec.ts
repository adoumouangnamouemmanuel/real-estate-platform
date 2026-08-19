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

test.describe("Dashboard shell", () => {
  test("a developer lands on the dashboard after login and sees the home overview", async ({
    page,
  }) => {
    await loginAsDeveloper(page);

    // Welcome header greets the signed-in developer by name.
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Kwame",
    );
    // Sidebar marks Dashboard Home as the current page.
    await expect(
      page
        .getByRole("navigation", { name: "Dashboard" })
        .first()
        .getByRole("link", { name: "Dashboard", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("the home page renders every overview section with real data", async ({
    page,
  }) => {
    await loginAsDeveloper(page);

    // KPI cards — only metrics with a real source. "Total Property Views" was
    // removed in Stage 6: it was a hardcoded 3742 with no per-view data behind
    // it, the one fabricated number on the page.
    await expect(page.getByText("Total Properties")).toBeVisible();
    await expect(page.getByText("Active Listings")).toBeVisible();
    await expect(page.getByText("Draft Listings")).toBeVisible();
    await expect(page.getByText("Total Property Views")).toHaveCount(0);

    // Recent Listings: a known mock listing appears in the listings table.
    await expect(
      page.getByRole("heading", { name: "Recent Listings" }),
    ).toBeVisible();
    await expect(
      page.getByRole("table").getByText("Luxury 3BR Apartment in East Legon"),
    ).toBeVisible();

    // Appointments, Notifications, Quick Actions, Activity all present.
    await expect(
      page.getByRole("heading", { name: "Appointments" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Notifications" }),
    ).toBeVisible();
    await expect(page.getByText("Add Property")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Recent Activity" }),
    ).toBeVisible();
  });

  test("the appointment overview switches between its tabs", async ({
    page,
  }) => {
    await loginAsDeveloper(page);

    await page.getByRole("tab", { name: /Requested/ }).click();
    await expect(page.getByRole("tab", { name: /Requested/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("not-yet-shipped destinations are absent from navigation, not disabled in it", async ({
    page,
  }) => {
    await loginAsDeveloper(page);

    // Profile & Company and Account Settings are still gated. They used to be
    // rendered as disabled rows carrying a "Soon" badge, which meant the first
    // authenticated screen advertised two things the product cannot do, in the
    // primary rail, above the fold. Navigation now lists only what can be
    // reached; the feature flags are untouched, so each returns when it ships.
    await expect(page.getByText("Profile & Company")).toHaveCount(0);
    await expect(page.getByText("Account Settings")).toHaveCount(0);
    await expect(page.getByText("Soon")).toHaveCount(0);
  });

  test("the account menu shows the developer's identity and logs out cleanly", async ({
    page,
  }) => {
    await loginAsDeveloper(page);

    await page.getByLabel(/Account menu/).click();
    await expect(page.getByText("Kwame Mensah")).toBeVisible();
    await expect(page.getByText("DEVELOPER")).toBeVisible();

    await page.getByRole("menuitem", { name: "Log out" }).click();
    // Logging out from a RequireAuth-guarded page correctly bounces to
    // /unauthorized (no longer authorized for the page you were standing on).
    await expect(page).toHaveURL("/unauthorized");

    // The session cookie set at login is cleared on logout too — a fresh visit
    // to /dashboard is rejected by proxy.ts again, same as any anonymous visitor.
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login?redirect=%2Fdashboard");
  });

  test("the mobile bottom nav and its More sheet expose every shipped destination", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsDeveloper(page);

    await expect(
      page.getByRole("navigation", { name: "Dashboard" }).getByRole("link", {
        name: "Dashboard",
        exact: true,
      }),
    ).toBeVisible();

    await page.getByRole("button", { name: "More" }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("Analytics")).toBeVisible();
    await expect(sheet.getByText("Notifications")).toBeVisible();
    // Account Settings is gated and therefore no longer listed here either —
    // the sheet is the same nav config as the desktop rail.
    await expect(sheet.getByText("Account Settings")).toHaveCount(0);
  });
});
