"use client";

import { useRef } from "react";
import { CircleCheck, CircleAlert } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AutosaveStatus } from "@/hooks/useAutosaveListing";
import type {
  ListingFormValues,
  PublishValidationResult,
} from "@/lib/validation/listing";
import type { StatusTransition } from "@/services";
import type { PropertyStatus } from "@/types";

interface ListingPublishBarProps {
  status: PropertyStatus;
  /** Draft: debounced autosave status. Published: explicit-save state instead (see isSaving). */
  autosaveStatus: AutosaveStatus;
  isDraft: boolean;
  isSaving: boolean;
  isTransitioning: boolean;
  transitions: StatusTransition[];
  canDelete: boolean;
  /** Undefined when not a draft — publishing is the only transition that has a "readiness" concept. */
  publishReadiness?: PublishValidationResult;
  onStatusTransition: (transition: StatusTransition) => void;
  onSaveChanges: () => void;
  onRetrySave: () => void;
  onDeleteRequest: () => void;
  onBack: () => void;
}

/** Maps a top-level form field to the DOM id of its input, so a missing-field
 * item can scroll/focus straight to it. */
const FIELD_INPUT_ID: Partial<Record<keyof ListingFormValues, string>> = {
  title: "listing-title",
  description: "listing-description",
  price: "listing-price",
  listingType: "listing-type",
  category: "listing-category",
  city: "listing-city",
  region: "listing-region",
  address: "listing-address",
  media: "listing-media-input",
};

/** "Ready to publish" or "N things need attention" — reads the exact same
 * `publishListingSchema` the Publish button itself validates against, so this
 * can never say "ready" when Publish would actually reject the listing. */
function PublishReadiness({
  readiness,
}: {
  readiness: PublishValidationResult;
}) {
  // The menu's own "return focus to the trigger on close" behavior would
  // otherwise race whatever we focus from an item's onClick and win — Base
  // UI's `finalFocus` is the library-supported way to override where focus
  // actually lands once the close transition finishes, so it isn't a race.
  const pendingFieldRef = useRef<keyof ListingFormValues | null>(null);

  if (readiness.success) {
    return (
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <CircleCheck className="text-primary size-3.5" aria-hidden />
        Ready to publish
      </span>
    );
  }

  const count = readiness.errors.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "text-muted-foreground",
        })}
      >
        <CircleAlert className="size-3.5" aria-hidden />
        {count} {count === 1 ? "thing needs" : "things need"} attention
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        finalFocus={() => {
          const id = pendingFieldRef.current
            ? FIELD_INPUT_ID[pendingFieldRef.current]
            : undefined;
          return id ? document.getElementById(id) : undefined;
        }}
      >
        {readiness.errors.map((issue) => (
          <DropdownMenuItem
            key={issue.field}
            onClick={() => {
              pendingFieldRef.current = issue.field;
              const id = FIELD_INPUT_ID[issue.field];
              const el = id ? document.getElementById(id) : null;
              if (!el) return;
              const reduceMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)",
              ).matches;
              el.scrollIntoView({
                behavior: reduceMotion ? "auto" : "smooth",
                block: "center",
              });
            }}
          >
            {issue.message}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const AUTOSAVE_LABEL: Record<AutosaveStatus, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save",
};

/**
 * Sticky action bar: status feedback on the left (autosave indicator for
 * drafts, an explicit Save button for published listings), status/delete
 * actions on the right. Every status transition button comes straight from
 * `STATUS_TRANSITIONS` (services/listing.service.ts) — the same source My
 * Properties' row menu reads — so "what moves are valid from here" can never
 * drift between the table and the editor.
 */
export function ListingPublishBar({
  status,
  autosaveStatus,
  isDraft,
  isSaving,
  isTransitioning,
  transitions,
  canDelete,
  publishReadiness,
  onStatusTransition,
  onSaveChanges,
  onRetrySave,
  onDeleteRequest,
  onBack,
}: ListingPublishBarProps) {
  return (
    <div className="bg-background/95 border-border bottom-dashboard-mobile-nav sticky z-10 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 backdrop-blur-sm md:bottom-0">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          Back to My Properties
        </Button>
        {isDraft ? (
          <span aria-live="polite" className="flex items-center gap-2 text-xs">
            <span
              className={
                autosaveStatus === "error"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }
            >
              {AUTOSAVE_LABEL[autosaveStatus]}
            </span>
            {autosaveStatus === "error" && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={onRetrySave}
              >
                Retry
              </Button>
            )}
          </span>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSaving}
            onClick={onSaveChanges}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {publishReadiness && <PublishReadiness readiness={publishReadiness} />}
        {canDelete && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDeleteRequest}
          >
            Delete
          </Button>
        )}
        {transitions.map((transition) => (
          <Button
            key={transition.target}
            type="button"
            size="sm"
            disabled={isTransitioning}
            onClick={() => onStatusTransition(transition)}
          >
            {transition.label}
          </Button>
        ))}
        {transitions.length === 0 && status === "SOLD" && (
          <span className="text-muted-foreground text-xs">
            Sold listings can&apos;t be reopened.
          </span>
        )}
      </div>
    </div>
  );
}
