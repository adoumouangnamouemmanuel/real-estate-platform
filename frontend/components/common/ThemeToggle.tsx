"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePreferences } from "@/hooks/usePreferences";
import { THEMES, type Theme } from "@/lib/preferences";
import { cn } from "@/lib/utils";

const THEME_META: Record<Theme, { label: string; icon: typeof Sun }> = {
  light: { label: "Light", icon: Sun },
  dark: { label: "Dark", icon: Moon },
  system: { label: "System", icon: Monitor },
};

/**
 * Quick appearance switch for the chrome. The same preference is also editable
 * in the accessibility panel's Appearance group — one model, two entry points,
 * so they can never disagree.
 *
 * The trigger shows the *resolved* icon (what you are actually looking at) but
 * announces the *chosen* setting, because "System" is a meaningful choice that
 * a sun icon alone would misreport.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { preferences, setPreference } = usePreferences();

  // Driven entirely by the store, so the hydration render uses the server
  // snapshot and React swaps in the real choice immediately afterwards — no
  // mismatch, and no need to branch on a "hydrated" flag.
  const Icon = THEME_META[preferences.theme].icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Appearance: ${THEME_META[preferences.theme].label}`}
        className={cn(
          "text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring/50 inline-flex size-9 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-3",
          className,
        )}
      >
        <Icon className="size-4.5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuRadioGroup
          value={preferences.theme}
          onValueChange={(value) => setPreference("theme", value as Theme)}
        >
          {THEMES.map((theme) => {
            const { label, icon: ThemeIcon } = THEME_META[theme];
            return (
              <DropdownMenuRadioItem key={theme} value={theme}>
                <ThemeIcon className="size-4" aria-hidden />
                {label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
