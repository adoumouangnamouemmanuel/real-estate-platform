"use client";

import { Heart, Info } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/common/EmptyState";
import { AnimatedNumber } from "@/components/motion";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useSavedProperties } from "@/hooks/useProperties";

/**
 * Saved Properties. No new favourites system: `useSavedProperties` composes the
 * existing `favoriteService` (which ids this browser has saved) with the
 * existing catalogue, and every card is the same `PropertyCard`, so its
 * `FavoriteButton` removes a property from here through exactly the same
 * optimistic mutation that added it — a card unsaved here leaves the list
 * immediately, with no second code path.
 *
 * The storage caveat is stated on the page rather than hidden: saves really are
 * per-browser localStorage today (see favorite.service.ts), and a page that
 * quietly implied an account-synced list would be claiming something the
 * backend doesn't do yet.
 */
export function SavedPropertiesView() {
  const { properties, savedCount, isLoading, isError, error } =
    useSavedProperties();

  return (
    <div className="container-page flex flex-col gap-6 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Saved Properties
        </h1>
        <p className="text-muted-foreground text-sm">
          {isLoading ? (
            "Loading your saved properties"
          ) : (
            <>
              <AnimatedNumber value={savedCount} />
              {savedCount === 1 ? " property saved" : " properties saved"}
            </>
          )}
        </p>
      </div>

      {savedCount > 0 && (
        <p className="text-muted-foreground border-border flex items-start gap-2 border-l-2 py-1 pl-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Saved properties are stored in this browser only — they won&apos;t
            follow you to another device yet.
          </span>
        </p>
      )}

      {!isLoading && !isError && savedCount === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          description="Use the heart on any listing to keep it here while you compare."
          action={
            <Link
              href={ROUTES.PROPERTIES}
              className={buttonVariants({ className: "mt-2 gap-2" })}
            >
              <Heart className="size-4" aria-hidden />
              Browse properties
            </Link>
          }
        />
      ) : (
        <PropertyGrid
          properties={properties}
          isLoading={isLoading}
          isError={isError}
          error={error}
          skeletonCount={Math.min(Math.max(savedCount, 1), 8)}
          emptyDescription="The properties you saved are no longer listed."
        />
      )}
    </div>
  );
}
