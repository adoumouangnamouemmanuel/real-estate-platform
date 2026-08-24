"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  applyPreferences,
  DEFAULT_PREFERENCES,
  prefersDarkScheme,
  readStoredPreferences,
  writeStoredPreferences,
  type Preferences,
} from "@/lib/preferences";

/**
 * Preferences live in a tiny external store rather than React state.
 *
 * `useSyncExternalStore` is the same primitive useReducedMotion already uses,
 * and it solves three problems at once here: `getServerSnapshot` returns the
 * defaults so SSR and the hydration render agree (no mismatch warning), React
 * re-reads the real value immediately after hydration, and every consumer stays
 * in sync without a provider or an effect that calls setState.
 *
 * The visual state is never waiting on any of this — the pre-paint script in
 * app/layout.tsx has already applied the stored preferences to <html>.
 */
let snapshot: Preferences | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/**
 * Must return a referentially stable object between changes: React compares
 * snapshots by identity, and a fresh object every call would loop forever.
 */
function getSnapshot(): Preferences {
  if (snapshot === null) snapshot = readStoredPreferences();
  return snapshot;
}

function getServerSnapshot(): Preferences {
  return DEFAULT_PREFERENCES;
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  // Another tab changed the settings — mirror them here rather than letting the
  // two windows disagree until the next reload.
  const onStorage = () => {
    snapshot = readStoredPreferences();
    applyPreferences(snapshot);
    emit();
  };
  window.addEventListener("storage", onStorage);

  // Only meaningful while theme is "system": follow the OS without rewriting
  // storage, so the stored choice stays "system".
  const query = window.matchMedia?.("(prefers-color-scheme: dark)");
  const onScheme = () => {
    if (getSnapshot().theme === "system") applyPreferences(getSnapshot());
    emit();
  };
  query?.addEventListener("change", onScheme);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
    query?.removeEventListener("change", onScheme);
  };
}

function update(next: Preferences) {
  snapshot = next;
  applyPreferences(next);
  writeStoredPreferences(next);
  emit();
}

/**
 * Read and write every client-side display preference.
 *
 * No provider required — the store is module-level, so this works in any client
 * component, including ones rendered outside the app shell in tests.
 */
export function usePreferences() {
  const preferences = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setPreference = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      update({ ...getSnapshot(), [key]: value });
    },
    [],
  );

  const reset = useCallback(() => {
    update(DEFAULT_PREFERENCES);
  }, []);

  const resolvedTheme: "light" | "dark" =
    preferences.theme === "system"
      ? prefersDarkScheme()
        ? "dark"
        : "light"
      : preferences.theme;

  return { preferences, resolvedTheme, setPreference, reset };
}

/** Test-only: drops the cached snapshot so each case starts from storage. */
export function __resetPreferencesStore() {
  snapshot = null;
  listeners.clear();
}
