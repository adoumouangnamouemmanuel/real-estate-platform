import { expect, test } from "@playwright/test";

/**
 * Tests proxy.ts's server-side cookie gate for anonymous visitors specifically.
 * Login/register set a mock marker cookie (lib/mockSessionCookie.ts, added in Phase
 * 6 so the dashboard is reachable at all — see ADR-009's addendum in
 * docs/ARCHITECTURE.md), so an authenticated developer now reaches /dashboard for
 * real; see e2e/dashboard.spec.ts. RequireAuth's role-forbidden path specifically
 * is still unit-tested only (RequireAuth.test.tsx, dashboard-shell.test.tsx): there's
 * no user-facing affordance for a wrong-role user to attempt entry, so it can't be
 * triggered via a real click path.
 */
test.describe("Protected routes", () => {
  test("an anonymous visitor to /dashboard is redirected to /login with a redirect param", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL("/login?redirect=%2Fdashboard");
    await expect(
      page.getByRole("heading", { level: 1, name: "Welcome back" }),
    ).toBeVisible();
  });

  test("an anonymous visitor to /admin is redirected to /login with a redirect param", async ({
    page,
  }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL("/login?redirect=%2Fadmin");
  });

  test("/unauthorized and /forbidden render with full Navbar/Footer chrome", async ({
    page,
  }) => {
    await page.goto("/unauthorized");
    await expect(page.getByText("Sign in required")).toBeVisible();
    await expect(page.getByRole("link", { name: "ByTe" })).toBeVisible();
    await expect(page.getByText("All rights reserved")).toBeVisible();

    await page.goto("/forbidden");
    await expect(page.getByText("Access denied")).toBeVisible();
    await expect(page.getByRole("link", { name: "ByTe" })).toBeVisible();
  });
});
