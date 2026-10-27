/** Pure locale preference helpers; safe to import from server utilities. */
export type Language = "en" | "fr";
export const LANGUAGE_STORAGE_KEY = "preferred-language";
export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "fr";
  try {
    const value =
      document.cookie
        .split("; ")
        .find((c) => c.startsWith("lumavok-language="))
        ?.split("=")[1] ?? localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return value === "en" ? "en" : "fr";
  } catch {
    return "fr";
  }
}
export function setStoredLanguage(language: Language): void {
  if (typeof document !== "undefined")
    document.cookie = `lumavok-language=${language}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {}
}
