import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "../public/locales/en/common.json";
import frCommon from "../public/locales/fr/common.json";

// Language storage key
export const LANGUAGE_STORAGE_KEY = "preferred-language";

// Supported languages
export const SUPPORTED_LANGUAGES = {
  fr: { label: "Français", short: "FR" },
  en: { label: "English", short: "EN" },
} as const;

export type Language = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Get the stored language preference or default to French
 */
export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "fr";
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && stored in SUPPORTED_LANGUAGES) {
      return stored as Language;
    }
  } catch {
    // localStorage unavailable
  }
  return "fr";
}

/**
 * Store language preference
 */
export function setStoredLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // localStorage unavailable
  }
}

// Initialize i18next
i18n.use(initReactI18next).init({
  resources: {
    fr: { common: frCommon },
    en: { common: enCommon },
  },
  lng: "fr", // French as default
  fallbackLng: "fr",
  ns: ["common"],
  defaultNS: "common",
  interpolation: {
    escapeValue: false, // React already escapes
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
