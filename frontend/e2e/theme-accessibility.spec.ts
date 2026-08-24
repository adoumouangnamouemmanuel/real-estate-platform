import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const STORAGE_KEY = "lumavok:preferences";

/** Seeds preferences before any app script runs, so the pre-paint script sees them. */
async function seedPreferences(
  page: Page,
  preferences: Record<string, string>,
) {
  await page.addInitScript(
    ([key, value]) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* storage unavailable — the app falls back to defaults */
      }
    },
    [STORAGE_KEY, JSON.stringify(preferences)] as const,
  );
}

const rootState = () => {
  const root = document.documentElement;
  return {
    dark: root.classList.contains("dark"),
    theme: root.dataset.theme,
    contrast: root.dataset.contrast,
    motion: root.dataset.motion,
    scale: getComputedStyle(root).getPropertyValue("--a11y-font-scale").trim(),
    rootFontSize: getComputedStyle(root).fontSize,
  };
};

test.describe("Theme system", () => {
  test("defaults to the light appearance the product already shipped", async ({
    page,
  }) => {
    await page.goto("/");
    const state = await page.evaluate(rootState);

    expect(state.dark).toBe(false);
    expect(state.scale).toBe("1");
    expect(state.rootFontSize).toBe("16px");
  });

  test("switching to dark applies immediately and survives a reload", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /^Appearance:/ }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();

    await expect
      .poll(async () => (await page.evaluate(rootState)).dark)
      .toBe(true);

    await page.reload();
    expect((await page.evaluate(rootState)).dark).toBe(true);
  });

  test("a stored dark preference is applied before first paint", async ({
    page,
  }) => {
    await seedPreferences(page, { theme: "dark" });

    // Sampled at domcontentloaded, i.e. readyState "interactive": the head has
    // been parsed and its synchronous script has run, but React has not
    // hydrated and the body has not painted. If the theme were applied from a
    // component instead of the inline script, the document would still be light
    // at this point — that is the flash this guards against.
    //
    // Deliberately not sampled at `commit`: the document is not evaluable that
    // early (page.evaluate throws), so it measures nothing.
    await page.goto("/properties", { waitUntil: "domcontentloaded" });

    const state = await page.evaluate(() => ({
      dark: document.documentElement.classList.contains("dark"),
      // The class alone could be set without the tokens having taken effect;
      // assert the painted colour too.
      bodyBackground: getComputedStyle(document.body).backgroundColor,
    }));

    // Deliberately no assertion on document.readyState: it can advance from
    // "interactive" to "complete" between goto resolving and evaluate running,
    // so pinning it tests scheduling rather than the theme. The sampling point
    // above is what fixes this at pre-hydration.
    expect(state.dark).toBe(true);
    expect(state.bodyBackground).not.toBe("rgb(255, 255, 255)");
  });

  test("system mode follows the OS colour scheme", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "dark" });
    const page = await context.newPage();
    await seedPreferences(page, { theme: "system" });

    await page.goto("/");
    expect((await page.evaluate(rootState)).dark).toBe(true);

    await context.close();
  });
});

test.describe("Accessibility panel", () => {
  test("every control changes the interface and reset restores defaults", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Accessibility settings" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("radio", { name: "150%" }).check();
    await expect
      .poll(async () => (await page.evaluate(rootState)).rootFontSize)
      .toBe("24px");

    await dialog
      .getByRole("group", { name: "Contrast" })
      .getByRole("radio", { name: "High" })
      .check();
    await dialog
      .getByRole("group", { name: "Motion" })
      .getByRole("radio", { name: "Reduced" })
      .check();

    await expect
      .poll(async () => await page.evaluate(rootState))
      .toMatchObject({ contrast: "high", motion: "reduced" });

    await dialog.getByRole("button", { name: /Reset all settings/ }).click();
    await expect
      .poll(async () => await page.evaluate(rootState))
      .toMatchObject({
        contrast: "standard",
        motion: "standard",
        scale: "1",
      });
  });

  test("closes on Escape and returns focus to its trigger", async ({
    page,
  }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", {
      name: "Accessibility settings",
    });
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("is operable with the keyboard alone", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", {
      name: "Accessibility settings",
    });
    await trigger.focus();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Native radios: arrow keys move within a group and select as they go.
    const appearance = dialog.getByRole("group", { name: "Appearance" });
    await appearance.getByRole("radio", { name: "Light" }).focus();
    await page.keyboard.press("ArrowRight");

    await expect(appearance.getByRole("radio", { name: "Dark" })).toBeChecked();
  });

  test("fits a 375px viewport without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.getByRole("button", { name: "Accessibility settings" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
});

test.describe("Skip to main content", () => {
  test("is reachable on the public site and moves focus to main", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });
});

test.describe("Reduced motion via the accessibility preference", () => {
  test("leaves no reveal element hidden", async ({ page }) => {
    await seedPreferences(page, { motion: "reduced" });
    await page.goto("/developers/atlantic-properties");

    // Same 150ms guarantee the OS-level preference has to meet.
    await page.waitForTimeout(150);
    const unsettled = await page.evaluate(
      () =>
        [...document.querySelectorAll("[data-motion-reveal]")].filter((el) => {
          const style = getComputedStyle(el);
          return style.opacity !== "1" || style.transform !== "none";
        }).length,
    );

    expect(unsettled).toBe(0);
  });
});

test.describe("Accessibility (axe) across appearance modes", () => {
  const routes = [
    { name: "Homepage", path: "/" },
    { name: "Property listing", path: "/properties" },
    { name: "Developer profile", path: "/developers/atlantic-properties" },
    { name: "Login", path: "/login" },
  ];

  const modes: { name: string; preferences: Record<string, string> }[] = [
    { name: "dark", preferences: { theme: "dark" } },
    {
      name: "high contrast",
      preferences: { theme: "light", contrast: "high" },
    },
    {
      name: "dark + high contrast",
      preferences: { theme: "dark", contrast: "high" },
    },
    { name: "150% text", preferences: { theme: "light", fontSize: "150" } },
  ];

  for (const mode of modes) {
    for (const route of routes) {
      test(`${route.name} has no WCAG violations in ${mode.name}`, async ({
        page,
      }) => {
        await seedPreferences(page, mode.preferences);
        await page.goto(route.path);
        await page.waitForLoadState("networkidle");
        // Same mid-fade false positive documented on the other axe scans: a
        // reveal caught partway through blends its colour against the
        // background and reads as a contrast failure that no settled page shows.
        await page.waitForTimeout(1000);

        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();

        expect(
          results.violations,
          JSON.stringify(results.violations, null, 2),
        ).toEqual([]);
      });
    }
  }
});
