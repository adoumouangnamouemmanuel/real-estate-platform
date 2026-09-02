"use client";

import { Globe } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/components/common/LanguageContext";
import { cn } from "@/lib/utils";
import { SUPPORTED_LANGUAGES, type Language } from "@/lib/i18n";

/**
 * Language toggle button with dropdown menu.
 * Shows the current language as a Globe icon with the language code.
 * Allows switching between French and English.
 */
export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium",
          "hover:bg-muted hover:text-foreground",
          "focus-visible:ring-ring/50 outline-none focus-visible:ring-3",
          "transition-colors",
        )}
        aria-label={SUPPORTED_LANGUAGES[language].label}
      >
        <Globe className="size-4" aria-hidden />
        <span className="hidden sm:inline">
          {SUPPORTED_LANGUAGES[language].short}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.entries(SUPPORTED_LANGUAGES) as [Language, { label: string; short: string }][]).map(
          ([code, { label, short }]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => setLanguage(code)}
              className={language === code ? "bg-accent" : ""}
            >
              <span className="mr-2 font-medium">{short}</span>
              <span className="text-muted-foreground">{label}</span>
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
