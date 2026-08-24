import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { AccessibilityPanel } from "./AccessibilityPanel";
import { __resetPreferencesStore } from "@/hooks/usePreferences";
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  readStoredPreferences,
} from "@/lib/preferences";

async function openPanel() {
  const user = userEvent.setup();
  render(<AccessibilityPanel />);
  await user.click(
    screen.getByRole("button", { name: "Accessibility settings" }),
  );
  return user;
}

describe("AccessibilityPanel", () => {
  beforeEach(() => {
    window.localStorage.clear();
    __resetPreferencesStore();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("style");
    for (const key of Object.keys(document.documentElement.dataset)) {
      delete document.documentElement.dataset[key];
    }
  });

  it("exposes every preference group with a visible label", async () => {
    await openPanel();

    for (const legend of [
      "Appearance",
      "Text size",
      "Motion",
      "Contrast",
      "Line spacing",
      "Letter spacing",
    ]) {
      expect(screen.getByText(legend)).toBeInTheDocument();
    }
  });

  it("uses native radios so the selected option is exposed to assistive tech", async () => {
    await openPanel();

    // Queried *through* the group on purpose. Four groups offer an option
    // labelled "Standard", and what disambiguates them is the fieldset/legend
    // pairing — which is also exactly what a screen reader announces on
    // entering the group. Resolving this way proves that association exists,
    // rather than papering over the collision with an aria-label.
    const motionGroup = screen.getByRole("group", { name: "Motion" });
    expect(
      within(motionGroup).getByRole("radio", { name: "Standard" }),
    ).toBeChecked();
    expect(
      within(motionGroup).getByRole("radio", { name: "Reduced" }),
    ).not.toBeChecked();
  });

  it("persists a change and applies it to the document element", async () => {
    const user = await openPanel();

    await user.click(screen.getByRole("radio", { name: "150%" }));

    expect(
      document.documentElement.style.getPropertyValue("--a11y-font-scale"),
    ).toBe("1.5");
    expect(readStoredPreferences().fontSize).toBe("150");
  });

  it("applies dark mode through the class the design system already keys on", async () => {
    const user = await openPanel();

    await user.click(screen.getByRole("radio", { name: "Dark" }));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(readStoredPreferences().theme).toBe("dark");
  });

  it("turns high contrast and reduced motion into document attributes", async () => {
    const user = await openPanel();

    await user.click(screen.getByRole("radio", { name: "High" }));
    await user.click(screen.getByRole("radio", { name: "Reduced" }));

    expect(document.documentElement.dataset.contrast).toBe("high");
    expect(document.documentElement.dataset.motion).toBe("reduced");
  });

  it("restores every default when reset, in storage and on the document", async () => {
    const user = await openPanel();

    await user.click(screen.getByRole("radio", { name: "Dark" }));
    await user.click(screen.getByRole("radio", { name: "130%" }));
    await user.click(screen.getByRole("radio", { name: "High" }));

    await user.click(
      screen.getByRole("button", { name: /Reset all settings/ }),
    );

    expect(readStoredPreferences()).toEqual(DEFAULT_PREFERENCES);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.dataset.contrast).toBe("standard");
    expect(
      document.documentElement.style.getPropertyValue("--a11y-font-scale"),
    ).toBe("1");
  });

  it("recovers from malformed stored preferences instead of throwing", async () => {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, "{corrupt");
    __resetPreferencesStore();

    await openPanel();

    expect(screen.getByRole("radio", { name: "100%" })).toBeChecked();
  });
});
