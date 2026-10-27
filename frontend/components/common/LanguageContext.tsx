"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { createInstance } from "i18next";
import baseI18n from "@/lib/i18n";

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
export function LanguageProvider({
  children,
  initialLanguage = "fr",
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const router = useRouter();
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [i18n] = useState(() => {
    const instance = createInstance();
    void instance.init({
      ...baseI18n.options,
      lng: initialLanguage,
      initAsync: false,
    });
    return instance;
  });
  const t = (key: string) => String(i18n.t(key));

  // Load stored language on mount
  useEffect(() => {
    const onLanguageChanged = (value: string) =>
      setLanguageState(value === "en" ? "en" : "fr");
    i18n.on("languageChanged", onLanguageChanged);
    const stored = getStoredLanguage();
    void i18n.changeLanguage(stored);
    document.documentElement.lang = stored;
    if (stored !== initialLanguage) {
      setStoredLanguage(stored);
      router.refresh();
    }
    return () => {
      i18n.off("languageChanged", onLanguageChanged);
    };
  }, [i18n, initialLanguage, router]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setStoredLanguage(lang);
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    router.refresh();
  };

  return (
    <I18nextProvider i18n={i18n} defaultNS="common">
      <LanguageContext.Provider value={{ language, setLanguage, t }}>
        {children}
      </LanguageContext.Provider>
    </I18nextProvider>
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
