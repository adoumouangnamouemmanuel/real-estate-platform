"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Either a single listing's title, or a count for a bulk delete. */
  target: { title: string } | { count: number };
  onConfirm: () => void;
  isPending: boolean;
}

/** Shared confirmation for both the single-row and bulk delete actions. */
export function DeleteListingDialog({
  open,
  onOpenChange,
  target,
  onConfirm,
  isPending,
}: DeleteListingDialogProps) {
  const description =
    "title" in target ? (
      <>
        This permanently deletes <strong>{target.title}</strong>. This
        can&apos;t be undone.
      </>
    ) : (
      <>
        This permanently deletes <strong>{target.count}</strong> listing
        {target.count === 1 ? "" : "s"}. This can&apos;t be undone.
      </>
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Delete listing{"count" in target && target.count !== 1 ? "s" : ""}?
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
