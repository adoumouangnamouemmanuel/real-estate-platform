"use client";

import { Accessibility, RotateCcw } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePreferences } from "@/hooks/usePreferences";
import type { Preferences } from "@/lib/preferences";
import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: string;
}

/**
 * A labelled group of mutually exclusive settings, built on native radio inputs.
 *
 * Native radios rather than buttons with role="radio": they bring correct group
 * semantics, arrow-key navigation and selected-state exposure for free, which is
 * exactly the "prefer native HTML, don't paper over it with ARIA" rule. The
 * input is visually hidden but not display:none, so it stays focusable and the
 * focus ring can be drawn on the label via peer-focus-visible.
 */
function OptionGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const groupId = useId();

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-foreground mb-2 text-sm font-medium">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const id = `${groupId}-${option.value}`;
          const selected = value === option.value;
          return (
            <div key={option.value} className="relative">
              {/* The input is transparent but covers the whole pill rather than
                  being sr-only, so the entire control is the hit target — a
                  clipped 1px input leaves the visible pill clickable only via
                  its label, which is worse for touch and hides the real control
                  from pointer input. It is still a native radio: focusable,
                  arrow-navigable, and named by its label. */}
              <input
                type="radio"
                id={id}
                name={`${name}-${groupId}`}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
              />
              <label
                htmlFor={id}
                className={cn(
                  // min-h-9 keeps every control at a comfortable target size
                  // even at 150% text scaling, where padding alone would not.
                  "ring-border peer-focus-visible:ring-ring pointer-events-none flex min-h-9 items-center justify-center rounded-md px-3 py-1.5 text-sm ring-1 transition-colors peer-focus-visible:ring-3",
                  selected
                    ? "bg-primary text-primary-foreground ring-primary font-medium"
                    : "bg-background text-muted-foreground",
                )}
              >
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

const APPEARANCE: readonly Option<Preferences["theme"]>[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const TEXT_SIZE: readonly Option<Preferences["fontSize"]>[] = [
  { value: "100", label: "100%" },
  { value: "115", label: "115%" },
  { value: "130", label: "130%" },
  { value: "150", label: "150%" },
];

const MOTION: readonly Option<Preferences["motion"]>[] = [
  { value: "standard", label: "Standard" },
  { value: "reduced", label: "Reduced" },
];

const CONTRAST: readonly Option<Preferences["contrast"]>[] = [
  { value: "standard", label: "Standard" },
  { value: "high", label: "High" },
];

const SPACING: readonly Option<Preferences["lineSpacing"]>[] = [
  { value: "standard", label: "Standard" },
  { value: "increased", label: "Increased" },
];

/**
 * The accessibility centre.
 *
 * Every control here changes something real and visible — there are no
 * placeholder toggles. Built from the app's own Dialog and tokens rather than a
 * third-party overlay, so it inherits focus trapping, Escape-to-close and
 * focus restoration from the primitive the rest of the product already uses.
 */
export function AccessibilityPanel({ className }: { className?: string }) {
  const { preferences, setPreference, reset } = usePreferences();

  return (
    <Dialog>
      <DialogTrigger
        aria-label="Accessibility settings"
        className={cn(
          "text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring/50 inline-flex size-9 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-3",
          className,
        )}
      >
        <Accessibility className="size-4.5" aria-hidden />
      </DialogTrigger>
      {/* Capped and internally scrollable: at 150% text on a 375px viewport the
          full set of groups is taller than the screen. */}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Accessibility</DialogTitle>
          <DialogDescription>
            These settings are saved in this browser and apply across Lumavok.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-2">
          <OptionGroup
            legend="Appearance"
            name="theme"
            options={APPEARANCE}
            value={preferences.theme}
            onChange={(value) => setPreference("theme", value)}
          />
          <OptionGroup
            legend="Text size"
            name="font-size"
            options={TEXT_SIZE}
            value={preferences.fontSize}
            onChange={(value) => setPreference("fontSize", value)}
          />
          <OptionGroup
            legend="Motion"
            name="motion"
            options={MOTION}
            value={preferences.motion}
            onChange={(value) => setPreference("motion", value)}
          />
          <OptionGroup
            legend="Contrast"
            name="contrast"
            options={CONTRAST}
            value={preferences.contrast}
            onChange={(value) => setPreference("contrast", value)}
          />
          <OptionGroup
            legend="Line spacing"
            name="line-spacing"
            options={SPACING}
            value={preferences.lineSpacing}
            onChange={(value) => setPreference("lineSpacing", value)}
          />
          <OptionGroup
            legend="Letter spacing"
            name="letter-spacing"
            options={SPACING}
            value={preferences.letterSpacing}
            onChange={(value) => setPreference("letterSpacing", value)}
          />
        </div>

        <div className="border-border border-t pt-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={reset}
            className="w-full gap-2"
          >
            <RotateCcw className="size-4" aria-hidden />
            Reset all settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
