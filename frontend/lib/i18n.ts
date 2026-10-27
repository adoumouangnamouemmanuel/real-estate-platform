import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "../public/locales/en/common.json";
import frCommon from "../public/locales/fr/common.json";

export {
  getStoredLanguage,
  setStoredLanguage,
  LANGUAGE_STORAGE_KEY,
} from "./locale";
export const SUPPORTED_LANGUAGES = {
  fr: { label: "Français", short: "FR" },
  en: { label: "English", short: "EN" },
} as const;
export type Language = keyof typeof SUPPORTED_LANGUAGES;

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
