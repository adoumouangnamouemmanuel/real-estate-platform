/**
 * The single source of truth for every client-side display preference:
 * appearance, text size, contrast, motion and reading spacing.
 *
 * One model, one storage key, one apply function. Components read preferences
 * through `usePreferences` (hooks/usePreferences.tsx) and never touch
 * localStorage themselves — the same discipline favorite.service.ts follows for
 * saved properties, for the same reason: scattered storage reads drift out of
 * sync and can't be reset centrally.
 *
 * Nothing here requires an account or a backend. These are per-browser display
 * settings, and there is no user-preferences endpoint in API_CONTRACT.md to
 * persist them to.
 */

export const THEMES = ["light", "dark", "system"] as const;
export const FONT_SIZES = ["100", "115", "130", "150"] as const;
export const CONTRASTS = ["standard", "high"] as const;
export const MOTIONS = ["standard", "reduced"] as const;
export const SPACINGS = ["standard", "increased"] as const;

export type Theme = (typeof THEMES)[number];
export type FontSize = (typeof FONT_SIZES)[number];
export type Contrast = (typeof CONTRASTS)[number];
export type MotionPreference = (typeof MOTIONS)[number];
export type Spacing = (typeof SPACINGS)[number];

export interface Preferences {
  theme: Theme;
  fontSize: FontSize;
  contrast: Contrast;
  motion: MotionPreference;
  lineSpacing: Spacing;
  letterSpacing: Spacing;
}

/**
 * Defaults reproduce the current production appearance exactly: light theme,
 * 100% text, standard everything. A first-time visitor must see precisely the
 * design shipped through Stage 7B — this system adds capability, it does not
 * change the default look.
 */
export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  fontSize: "100",
  contrast: "standard",
  motion: "standard",
  lineSpacing: "standard",
  letterSpacing: "standard",
};

export const PREFERENCES_STORAGE_KEY = "lumavok:preferences";

/** Multiplier applied to the root font size. Keep in sync with FONT_SIZES. */
export const FONT_SCALE: Record<FontSize, string> = {
  "100": "1",
  "115": "1.15",
  "130": "1.3",
  "150": "1.5",
};

function isMember<T extends readonly string[]>(
  allowed: T,
  value: unknown,
): value is T[number] {
  return (
    typeof value === "string" && (allowed as readonly string[]).includes(value)
  );
}

/**
 * Field-by-field validation rather than a blanket `JSON.parse as Preferences`.
 * Storage is user-writable and survives across deploys, so a stored blob may be
 * malformed, partial, or from an older shape. Each field independently falls
 * back to its default, so one bad value never discards the rest.
 */
export function parsePreferences(raw: string | null): Preferences {
  if (!raw) return DEFAULT_PREFERENCES;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_PREFERENCES;
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return DEFAULT_PREFERENCES;
  }

  const value = parsed as Record<string, unknown>;
  return {
    theme: isMember(THEMES, value.theme)
      ? value.theme
      : DEFAULT_PREFERENCES.theme,
    fontSize: isMember(FONT_SIZES, value.fontSize)
      ? value.fontSize
      : DEFAULT_PREFERENCES.fontSize,
    contrast: isMember(CONTRASTS, value.contrast)
      ? value.contrast
      : DEFAULT_PREFERENCES.contrast,
    motion: isMember(MOTIONS, value.motion)
      ? value.motion
      : DEFAULT_PREFERENCES.motion,
    lineSpacing: isMember(SPACINGS, value.lineSpacing)
      ? value.lineSpacing
      : DEFAULT_PREFERENCES.lineSpacing,
    letterSpacing: isMember(SPACINGS, value.letterSpacing)
      ? value.letterSpacing
      : DEFAULT_PREFERENCES.letterSpacing,
  };
}

export function readStoredPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    return parsePreferences(
      window.localStorage.getItem(PREFERENCES_STORAGE_KEY),
    );
  } catch {
    // localStorage throws outright in some privacy modes rather than returning
    // null. Preferences are an enhancement — never let them break the page.
    return DEFAULT_PREFERENCES;
  }
}

export function writeStoredPreferences(preferences: Preferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    );
  } catch {
    // Quota exceeded or storage disabled — the in-memory preference still
    // applies for this session, it just won't survive a reload.
  }
}

export function prefersDarkScheme(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Resolves "system" to the concrete theme actually being displayed. */
export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") return prefersDarkScheme() ? "dark" : "light";
  return theme;
}

/**
 * Writes preferences to the document element as a class plus data attributes.
 *
 * Everything visual is driven from here so the CSS in globals.css can handle
 * theming centrally — no `dark:` variants scattered through components, and no
 * component needs to know a preference exists. `.dark` specifically is the class
 * the existing `@custom-variant dark (&:is(.dark *))` already keys on, so the
 * whole component library inherits dark mode without modification.
 */
export function applyPreferences(preferences: Preferences): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  root.classList.toggle("dark", resolveTheme(preferences.theme) === "dark");
  root.dataset.theme = preferences.theme;
  root.dataset.contrast = preferences.contrast;
  root.dataset.motion = preferences.motion;
  root.dataset.lineSpacing = preferences.lineSpacing;
  root.dataset.letterSpacing = preferences.letterSpacing;
  root.style.setProperty("--a11y-font-scale", FONT_SCALE[preferences.fontSize]);
  root.style.colorScheme = resolveTheme(preferences.theme);
}
