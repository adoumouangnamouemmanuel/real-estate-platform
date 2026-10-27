"use client";
import { useTranslation } from "react-i18next";

/** Reactive display preference; usable by query hooks outside the app shell. */
export function useContentLocale() {
  const { i18n } = useTranslation();
  return { language: i18n.resolvedLanguage === "en" ? "en" : "fr" } as const;
}
