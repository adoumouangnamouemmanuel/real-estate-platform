"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import type { AutosaveStatus } from "@/hooks/useAutosaveListing";

export type ListingEditorMode = "create" | "edit";

export interface ListingIdentity {
  id: string;
  slug: string;
}

interface ListingEditorContextValue {
  mode: ListingEditorMode;
  /** Null for a brand-new listing until its first autosave mints an id/slug. */
  identity: ListingIdentity | null;
  setIdentity: (identity: ListingIdentity) => void;
  autosaveStatus: AutosaveStatus;
  setAutosaveStatus: (status: AutosaveStatus) => void;
  isPublishing: boolean;
  setIsPublishing: (value: boolean) => void;
}

const ListingEditorContext = createContext<ListingEditorContextValue | null>(
  null,
);

export function useListingEditorContext() {
  const context = useContext(ListingEditorContext);
  if (!context) {
    throw new Error(
      "useListingEditorContext must be used within a ListingEditorProvider",
    );
  }
  return context;
}

interface ListingEditorProviderProps {
  mode: ListingEditorMode;
  initialIdentity: ListingIdentity | null;
  children: ReactNode;
}

/**
 * Holds editor UI metadata that isn't itself a form field — the listing's
 * identity (null until a brand-new draft's first autosave creates one),
 * autosave status, and whether a publish is in flight — so section components
 * and the publish bar can read/update it without prop-drilling through
 * ListingForm. Form VALUES stay entirely in React Hook Form's own context
 * (via FormProvider, set up by ListingForm); this provider never duplicates
 * or shadows them — it's metadata about the edit session, not the data itself.
 */
export function ListingEditorProvider({
  mode,
  initialIdentity,
  children,
}: ListingEditorProviderProps) {
  const [identity, setIdentity] = useState(initialIdentity);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const [isPublishing, setIsPublishing] = useState(false);

  return (
    <ListingEditorContext.Provider
      value={{
        mode,
        identity,
        setIdentity,
        autosaveStatus,
        setAutosaveStatus,
        isPublishing,
        setIsPublishing,
      }}
    >
      {children}
    </ListingEditorContext.Provider>
  );
}
