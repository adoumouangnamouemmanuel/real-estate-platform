import { beforeEach, describe, expect, it } from "vitest";

import {
  applyPreferences,
  DEFAULT_PREFERENCES,
  FONT_SCALE,
  parsePreferences,
  PREFERENCES_STORAGE_KEY,
  readStoredPreferences,
  resolveTheme,
  writeStoredPreferences,
  type Preferences,
} from "./preferences";

describe("preferences model", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("style");
  });

  describe("defaults", () => {
    it("defaults to the current production appearance", () => {
      // Light-equivalent (system resolves to light without a dark OS setting),
      // 100% text, standard everything. Stage 8 adds capability; it must not
      // change what a first-time visitor sees.
      expect(DEFAULT_PREFERENCES).toEqual({
        theme: "system",
        fontSize: "100",
        contrast: "standard",
        motion: "standard",
        lineSpacing: "standard",
        letterSpacing: "standard",
      });
    });

    it("returns defaults when nothing is stored", () => {
      expect(readStoredPreferences()).toEqual(DEFAULT_PREFERENCES);
    });
  });

  describe("parsing malformed storage", () => {
    it.each([
      ["null", null],
      ["empty string", ""],
      ["invalid JSON", "{not json"],
      ["a JSON array", "[1,2,3]"],
      ["a JSON primitive", '"dark"'],
      ["JSON null", "null"],
    ])("falls back to defaults for %s", (_label, raw) => {
      expect(parsePreferences(raw)).toEqual(DEFAULT_PREFERENCES);
    });

    it("keeps valid fields and defaults only the invalid ones", () => {
      // One bad value must not discard the user's other choices.
      const parsed = parsePreferences(
        JSON.stringify({
          theme: "dark",
          fontSize: "999",
          contrast: "high",
          motion: {},
        }),
      );

      expect(parsed.theme).toBe("dark");
      expect(parsed.contrast).toBe("high");
      expect(parsed.fontSize).toBe("100");
      expect(parsed.motion).toBe("standard");
    });

    it("ignores unknown extra keys", () => {
      const parsed = parsePreferences(
        JSON.stringify({ theme: "light", somethingElse: true }),
      );
      expect(parsed).toEqual({ ...DEFAULT_PREFERENCES, theme: "light" });
    });
  });

  describe("persistence", () => {
    it("round-trips through localStorage", () => {
      const preferences: Preferences = {
        theme: "dark",
        fontSize: "130",
        contrast: "high",
        motion: "reduced",
        lineSpacing: "increased",
        letterSpacing: "increased",
      };

      writeStoredPreferences(preferences);
      expect(readStoredPreferences()).toEqual(preferences);
    });

    it("uses a single storage key", () => {
      writeStoredPreferences(DEFAULT_PREFERENCES);
      expect(Object.keys(window.localStorage)).toEqual([
        PREFERENCES_STORAGE_KEY,
      ]);
    });
  });

  describe("applyPreferences", () => {
    it("writes theme, contrast, motion and spacing onto the document element", () => {
      applyPreferences({
        theme: "dark",
        fontSize: "150",
        contrast: "high",
        motion: "reduced",
        lineSpacing: "increased",
        letterSpacing: "increased",
      });

      const root = document.documentElement;
      expect(root.classList.contains("dark")).toBe(true);
      expect(root.dataset.contrast).toBe("high");
      expect(root.dataset.motion).toBe("reduced");
      expect(root.dataset.lineSpacing).toBe("increased");
      expect(root.dataset.letterSpacing).toBe("increased");
      expect(root.style.getPropertyValue("--a11y-font-scale")).toBe("1.5");
    });

    it("removes the dark class when switching back to light", () => {
      applyPreferences({ ...DEFAULT_PREFERENCES, theme: "dark" });
      expect(document.documentElement.classList.contains("dark")).toBe(true);

      applyPreferences({ ...DEFAULT_PREFERENCES, theme: "light" });
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("sets colorScheme so native UI (scrollbars, form controls) matches", () => {
      applyPreferences({ ...DEFAULT_PREFERENCES, theme: "dark" });
      expect(document.documentElement.style.colorScheme).toBe("dark");
    });

    it("maps every font size to a scale factor", () => {
      for (const [size, scale] of Object.entries(FONT_SCALE)) {
        applyPreferences({
          ...DEFAULT_PREFERENCES,
          fontSize: size as Preferences["fontSize"],
        });
        expect(
          document.documentElement.style.getPropertyValue("--a11y-font-scale"),
        ).toBe(scale);
      }
    });
  });

  describe("resolveTheme", () => {
    it("passes through explicit choices", () => {
      expect(resolveTheme("light")).toBe("light");
      expect(resolveTheme("dark")).toBe("dark");
    });

    it("resolves system against the OS preference", () => {
      // jsdom's matchMedia stub reports no match, so system means light here.
      expect(resolveTheme("system")).toBe("light");
    });
  });
});
