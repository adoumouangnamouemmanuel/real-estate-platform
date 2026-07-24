"use client";

import type { AutosaveStatus } from "@/hooks/useAutosaveListing";
import { Button } from "@/components/ui/button";
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
  onStatusTransition: (transition: StatusTransition) => void;
  onSaveChanges: () => void;
  onRetrySave: () => void;
  onDeleteRequest: () => void;
  onBack: () => void;
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
  onStatusTransition,
  onSaveChanges,
  onRetrySave,
  onDeleteRequest,
  onBack,
}: ListingPublishBarProps) {
  return (
    <div className="bg-background/95 border-border sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 backdrop-blur-sm">
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
