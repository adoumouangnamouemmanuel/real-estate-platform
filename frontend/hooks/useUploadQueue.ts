"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

import { getErrorMessage } from "@/lib/errors";
import { uploadService, type UploadedFile } from "@/services";

/**
 * Explicit per-file lifecycle: QUEUED (enqueued, upload not yet started) →
 * UPLOADING → UPLOADED, or UPLOADING → FAILED. Retry re-enters UPLOADING from
 * FAILED — it's an action, not a state of its own. Modeling this as a real
 * state machine (rather than a boolean isUploading flag) is what lets the UI
 * show each file's own status independently while a batch uploads in parallel.
 */
export type UploadItemStatus = "QUEUED" | "UPLOADING" | "UPLOADED" | "FAILED";

export interface UploadQueueItem {
  /** Stable client-side id, unrelated to the eventual Cloudinary publicId — survives retries. */
  id: string;
  file: File;
  /** Local object URL — the only preview available until (and instead of) the mock's fake remote URL. */
  previewUrl: string;
  status: UploadItemStatus;
  error?: string;
  result?: UploadedFile;
}

type Action =
  | { type: "ENQUEUE"; items: UploadQueueItem[] }
  | { type: "UPLOADING"; id: string }
  | { type: "UPLOADED"; id: string; result: UploadedFile }
  | { type: "FAILED"; id: string; error: string }
  | { type: "REMOVE"; id: string };

function reducer(state: UploadQueueItem[], action: Action): UploadQueueItem[] {
  switch (action.type) {
    case "ENQUEUE":
      return [...state, ...action.items];
    case "UPLOADING":
      return state.map((item) =>
        item.id === action.id
          ? { ...item, status: "UPLOADING", error: undefined }
          : item,
      );
    case "UPLOADED":
      return state.map((item) =>
        item.id === action.id
          ? { ...item, status: "UPLOADED", result: action.result }
          : item,
      );
    case "FAILED":
      return state.map((item) =>
        item.id === action.id
          ? { ...item, status: "FAILED", error: action.error }
          : item,
      );
    case "REMOVE":
      return state.filter((item) => item.id !== action.id);
  }
}

/**
 * Owns the transient upload lifecycle for the media section: enqueueing files,
 * running each through `uploadService`, and exposing per-file status for retry.
 * Deliberately separate from the form's committed `media` field array (RHF
 * remains the source of truth for what's actually saved) — this hook only
 * tracks files on their way in; `MediaUploader` syncs `UPLOADED` results into
 * the form once each finishes.
 */
export function useUploadQueue() {
  const [items, dispatch] = useReducer(reducer, []);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const runUpload = useCallback(async (id: string, file: File) => {
    dispatch({ type: "UPLOADING", id });
    try {
      const result = await uploadService.uploadFile(file);
      dispatch({ type: "UPLOADED", id, result });
    } catch (error) {
      dispatch({ type: "FAILED", id, error: getErrorMessage(error) });
    }
  }, []);

  const enqueue = useCallback(
    (files: File[]) => {
      const queued: UploadQueueItem[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "QUEUED",
      }));
      dispatch({ type: "ENQUEUE", items: queued });
      queued.forEach((item) => void runUpload(item.id, item.file));
      return queued;
    },
    [runUpload],
  );

  const retry = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((entry) => entry.id === id);
      if (item) void runUpload(id, item.file);
    },
    [runUpload],
  );

  const remove = useCallback((id: string) => {
    const item = itemsRef.current.find((entry) => entry.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    dispatch({ type: "REMOVE", id });
  }, []);

  return { items, enqueue, retry, remove };
}
