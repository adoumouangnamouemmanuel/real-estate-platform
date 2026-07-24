"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, type UseFormReturn } from "react-hook-form";

import type { ListingFormValues } from "@/lib/validation/listing";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

const DEFAULT_DEBOUNCE_MS = 2000;
const MAX_CONSECUTIVE_FAILURES = 3;

/**
 * Extracts only the fields RHF's `dirtyFields` marks as changed, so autosave
 * sends a PATCH of just what the developer actually edited rather than the
 * whole form on every tick. `dirtyFields` mirrors the form shape with `true`
 * on changed leaves; for an array field (media) it's a truthy array as soon
 * as any entry changes, which correctly pulls in the whole current array —
 * `listingService.updateListing` replaces array fields wholesale, not
 * per-index, so sending the full array under that one key is the right unit.
 */
export function pickDirtyValues<T extends Record<string, unknown>>(
  values: T,
  dirtyFields: Partial<Record<keyof T, unknown>>,
): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(dirtyFields) as (keyof T)[]) {
    if (dirtyFields[key]) result[key] = values[key];
  }
  return result;
}

interface UseAutosaveListingOptions {
  form: UseFormReturn<ListingFormValues>;
  /** Gate autosave to drafts only — a live, publicly-visible listing shouldn't change under a buyer's nose mid-edit. */
  enabled: boolean;
  onSave: (patch: Partial<ListingFormValues>) => Promise<unknown>;
  debounceMs?: number;
}

/**
 * Debounced, dirty-fields-only autosave. After three consecutive failures it
 * stops scheduling further silent attempts (a flaky connection shouldn't spam
 * retries) — `saveNow` (a manual retry affordance) always resets the counter
 * and tries again immediately.
 *
 * Subscribes to `dirtyFields` via `useFormState` rather than reading
 * `form.formState.dirtyFields` directly: RHF's formState is a Proxy that only
 * updates lazily once something actually subscribes to the field it exposes —
 * reading it imperatively from inside an async callback with no render-time
 * subscription anywhere returns a stale (often empty) snapshot instead of the
 * live value.
 */
export function useAutosaveListing({
  form,
  enabled,
  onSave,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseAutosaveListingOptions) {
  const { dirtyFields } = useFormState({ control: form.control });
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failureCountRef = useRef(0);
  const onSaveRef = useRef(onSave);
  const performSaveRef = useRef<() => Promise<void>>(async () => {});

  async function performSave() {
    const dirty = pickDirtyValues(form.getValues(), dirtyFields);
    if (Object.keys(dirty).length === 0) return;

    setStatus("saving");
    try {
      await onSaveRef.current(dirty);
      // form.getValues() called fresh right here (not a snapshot captured
      // before the await) — react-hook-form's `isDirty` compares against
      // whatever baseline reset() is given, so passing no values at all would
      // leave the OLD baseline in place and isDirty permanently true after
      // every save. Reading now naturally folds in anything that changed
      // concurrently (e.g. a photo upload's append() finishing mid-save),
      // rather than risking a stale pre-await snapshot overwriting it.
      form.reset(form.getValues(), { keepDirty: false });
      setStatus("saved");
      failureCountRef.current = 0;
    } catch {
      failureCountRef.current += 1;
      setStatus("error");
    }
  }

  // Refreshed after every render (no dependency array is deliberate here) so
  // the setTimeout callback scheduled below — which can fire many renders
  // later — always calls a version of performSave closing over the current
  // dirtyFields/onSave, never a stale one captured when the effect first ran.
  useEffect(() => {
    onSaveRef.current = onSave;
    performSaveRef.current = performSave;
  });

  useEffect(() => {
    if (!enabled) return;

    const subscription = form.watch(() => {
      if (failureCountRef.current >= MAX_CONSECUTIVE_FAILURES) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(
        () => void performSaveRef.current(),
        debounceMs,
      );
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, debounceMs, form]);

  async function saveNow() {
    failureCountRef.current = 0;
    await performSaveRef.current();
  }

  return { status, saveNow };
}
