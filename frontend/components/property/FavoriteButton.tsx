"use client";

import { Heart } from "lucide-react";

import { useIsFavorited, useToggleFavorite } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  propertyId: string;
  propertyTitle: string;
  /** "sm" sits on top of a card's image; "lg" sits inline on the detail page next to Share/Contact. */
  size?: "sm" | "lg";
  className?: string;
}

/**
 * Deliberately not nested inside PropertyCard's <Link> — a <button> inside an
 * <a> is invalid HTML and would make the favorite action unreachable as its
 * own accessible control. Rendered as the Link's sibling instead, positioned
 * on top of it (see PropertyCard) — reused as-is on the detail page where
 * there's no surrounding link to conflict with.
 */
export function FavoriteButton({
  propertyId,
  propertyTitle,
  size = "sm",
  className,
}: FavoriteButtonProps) {
  const isFavorited = useIsFavorited(propertyId);
  const toggle = useToggleFavorite();

  return (
    <button
      type="button"
      aria-pressed={isFavorited}
      aria-label={
        isFavorited
          ? `Remove ${propertyTitle} from saved properties`
          : `Save ${propertyTitle}`
      }
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle.mutate(propertyId);
      }}
      className={cn(
        "focus-visible:ring-ring inline-flex items-center justify-center rounded-full transition-transform duration-150 focus-visible:ring-3 focus-visible:outline-none active:scale-90",
        size === "sm"
          ? "bg-background/90 size-9 shadow-sm backdrop-blur-sm hover:scale-105"
          : "border-border hover:bg-muted size-11 border",
        className,
      )}
    >
      <Heart
        aria-hidden
        className={cn(
          "transition-all duration-200",
          size === "sm" ? "size-4.5" : "size-5",
          isFavorited
            ? "fill-brand-gold text-brand-gold scale-110"
            : "text-foreground scale-100",
        )}
      />
    </button>
  );
}
