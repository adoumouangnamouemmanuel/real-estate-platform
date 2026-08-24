import type { ComponentPropsWithoutRef, ElementType } from "react";

import { cn } from "@/lib/utils";

const GLASS_TONE = {
  /** Persistent chrome that must stay legible over any content scrolling beneath it — navbar. */
  chrome: "bg-background/80 backdrop-blur-md border-border/60",
  /** Content surfaces sitting over imagery — auth panel, floating search, gallery overlays. */
  panel: "bg-background/90 backdrop-blur-lg border-border/40 shadow-lg",
} as const;

type GlassSurfaceProps<T extends ElementType> = {
  as?: T;
  tone?: keyof typeof GLASS_TONE;
  className?: string;
} & Omit<ComponentPropsWithoutRef<ElementType>, "as" | "className">;

/**
 * Restrained frosted-glass treatment — "frosted architectural glass," not a
 * glassmorphism-kit look. Reserve for the surfaces the brief calls out
 * (Navbar, auth panel, floating search, limited overlays), not every card.
 */
export function GlassSurface<T extends ElementType = "div">({
  as,
  tone = "panel",
  className,
  ...props
}: GlassSurfaceProps<T>) {
  const Component = as ?? "div";
  return (
    <Component
      // Marks every glass surface for the high-contrast override in globals.css,
      // which makes them opaque — translucency is the first thing to fail for a
      // user who has explicitly asked for maximum contrast.
      data-glass-surface=""
      className={cn("border", GLASS_TONE[tone], className)}
      {...props}
    />
  );
}
