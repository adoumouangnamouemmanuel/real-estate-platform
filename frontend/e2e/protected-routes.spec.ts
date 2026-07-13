import { expect, test } from "@playwright/test";

/**
 * Tests proxy.ts's server-side cookie gate specifically. RequireAuth's client-side
 * role-forbidden path is intentionally NOT covered here: in this mock environment
 * (no real backend), mock login/register can't set a real HttpOnly cookie, so
 * proxy.ts's redirect-to-login always wins before RequireAuth is ever reached — see
 * ADR's Phase 5.5 commit message. That path is unit-tested instead
 * (RequireAuth.test.tsx, with a mocked store).
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
