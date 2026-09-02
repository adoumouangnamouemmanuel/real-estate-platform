"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getStoredLanguage,
  setStoredLanguage,
  type Language,
} from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

/**
 * Language provider that syncs i18next with React state and persists
 * the user's language preference to localStorage.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");
  const { i18n, t } = useTranslation("common");

  // Load stored language on mount
  useEffect(() => {
    const stored = getStoredLanguage();
    setLanguageState(stored);
    i18n.changeLanguage(stored);
    document.documentElement.lang = stored;
  }, [i18n]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setStoredLanguage(lang);
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access language context
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
