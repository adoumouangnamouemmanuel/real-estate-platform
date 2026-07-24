"use client";

import { useEffect, useRef } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, Upload, X } from "lucide-react";

import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUploadQueue } from "@/hooks/useUploadQueue";
import type { ListingFormValues } from "@/lib/validation/listing";
import { uploadService } from "@/services";

const MAX_IMAGES = 10;
const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function validateFiles(files: File[], currentCount: number): File[] {
  const accepted: File[] = [];
  let remaining = MAX_IMAGES - currentCount;

  for (const file of files) {
    if (remaining <= 0) {
      toast.error(`You can only have up to ${MAX_IMAGES} photos per listing.`);
      break;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(`${file.name} isn't a supported image format.`);
      continue;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`${file.name} is larger than ${MAX_FILE_SIZE_MB} MB.`);
      continue;
    }
    accepted.push(file);
    remaining -= 1;
  }

  return accepted;
}

/**
 * Media management for the listing: an upload queue (see useUploadQueue for
 * the QUEUED → UPLOADING → UPLOADED/FAILED state machine) feeding into the
 * form's committed `media` field array. Reordering and cover-image selection
 * are driven by each item's explicit `order` field, not array position — an
 * async upload queue can finish out of order, so array index alone can't be
 * trusted to mean "display order." Move buttons (not drag-and-drop, which
 * would need a new dependency and its own keyboard-accessibility work) swap
 * `order` values between visually-adjacent items; the cover image is always
 * whichever item currently has the lowest `order`.
 */
export function MediaUploader() {
  const {
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<ListingFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "media",
    keyName: "fieldId",
  });
  // useFieldArray's `fields` only updates on structural operations (append/
  // remove/move) — it does not re-render when a leaf value like `order`
  // changes via plain setValue (same class of staleness as formState.dirtyFields
  // elsewhere in the editor). useWatch gives the live values; fields still
  // supplies the stable `fieldId` React needs as a list key.
  const watchedMedia = useWatch({ control, name: "media" }) ?? [];
  const queue = useUploadQueue();
  const inputRef = useRef<HTMLInputElement>(null);
  const syncedQueueIds = useRef(new Set<string>());

  useEffect(() => {
    queue.items.forEach((item) => {
      if (
        item.status === "UPLOADED" &&
        item.result &&
        !syncedQueueIds.current.has(item.id)
      ) {
        syncedQueueIds.current.add(item.id);
        const currentMedia = getValues("media") ?? [];
        append(
          {
            url: item.result.url,
            publicId: item.result.publicId,
            order: currentMedia.length,
          },
          { shouldFocus: false },
        );
      }
    });
  }, [queue.items, append, getValues]);

  const pendingCount = queue.items.filter(
    (item) => item.status === "QUEUED" || item.status === "UPLOADING",
  ).length;

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const currentCount = fields.length + pendingCount;
    const accepted = validateFiles(Array.from(fileList), currentCount);
    if (accepted.length > 0) queue.enqueue(accepted);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove(index: number, publicId: string) {
    remove(index);
    void uploadService.deleteUpload(publicId);
  }

  const sorted = fields
    .map((field, index) => ({
      ...field,
      ...watchedMedia[index],
      index,
    }))
    .sort((a, b) => a.order - b.order);

  function swapOrder(a: number, b: number) {
    const media = getValues("media") ?? [];
    const orderA = media[a]?.order;
    const orderB = media[b]?.order;
    if (orderA === undefined || orderB === undefined) return;
    setValue(`media.${a}.order`, orderB, { shouldDirty: true });
    setValue(`media.${b}.order`, orderA, { shouldDirty: true });
  }

  function moveEarlier(position: number) {
    if (position === 0) return;
    swapOrder(sorted[position].index, sorted[position - 1].index);
  }

  function moveLater(position: number) {
    if (position === sorted.length - 1) return;
    swapOrder(sorted[position].index, sorted[position + 1].index);
  }

  return (
    <DashboardSection
      title="Photos"
      description={`Up to ${MAX_IMAGES} photos. The first photo is the cover image.`}
    >
      <div className="flex flex-col gap-4">
        {errors.media?.message && (
          <p role="alert" className="text-destructive text-xs">
            {errors.media.message}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {sorted.map((item, position) => (
            <div
              key={item.fieldId}
              className="border-border relative overflow-hidden rounded-lg border"
            >
              <div className="bg-muted aspect-square w-full">
                {/* eslint-disable-next-line @next/next/no-img-element -- mock upload URLs aren't real remote hosts next/image can optimize */}
                <img
                  src={item.url}
                  alt={position === 0 ? "Cover photo" : `Photo ${position + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
              {position === 0 && (
                <Badge className="absolute top-1.5 left-1.5">Cover</Badge>
              )}
              <div className="absolute right-1.5 bottom-1.5 flex gap-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-xs"
                  aria-label="Move earlier"
                  disabled={position === 0}
                  onClick={() => moveEarlier(position)}
                >
                  <ArrowLeft />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-xs"
                  aria-label="Move later"
                  disabled={position === sorted.length - 1}
                  onClick={() => moveLater(position)}
                >
                  <ArrowRight />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  aria-label="Remove photo"
                  onClick={() => handleRemove(item.index, item.publicId)}
                >
                  <X />
                </Button>
              </div>
            </div>
          ))}

          {queue.items
            .filter((item) => item.status !== "UPLOADED")
            .map((item) => (
              <div
                key={item.id}
                className="border-border relative overflow-hidden rounded-lg border"
              >
                <div className="bg-muted aspect-square w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview, next/image can't optimize it */}
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="h-full w-full object-cover opacity-60"
                  />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 text-white">
                  {item.status === "FAILED" ? (
                    <>
                      <span className="px-2 text-center text-xs">
                        Upload failed
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        onClick={() => queue.retry(item.id)}
                      >
                        Retry
                      </Button>
                    </>
                  ) : (
                    <Loader2
                      className="size-5 animate-spin"
                      aria-label="Uploading"
                    />
                  )}
                </div>
                {item.status === "FAILED" && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-xs"
                    aria-label="Remove"
                    className="absolute right-1.5 bottom-1.5"
                    onClick={() => queue.remove(item.id)}
                  >
                    <X />
                  </Button>
                )}
              </div>
            ))}

          {fields.length + pendingCount < MAX_IMAGES && (
            <label
              htmlFor="listing-media-input"
              className="border-border text-muted-foreground hover:border-primary/40 hover:text-foreground flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs"
            >
              <Upload className="size-5" aria-hidden />
              Add photos
              <input
                ref={inputRef}
                id="listing-media-input"
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                multiple
                className="sr-only"
                onChange={(event) => handleFilesSelected(event.target.files)}
              />
            </label>
          )}
        </div>
      </div>
    </DashboardSection>
  );
}
