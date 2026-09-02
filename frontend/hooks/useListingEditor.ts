"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { LISTINGS_KEY } from "@/hooks/useListings";
import { listingService, type ListingPatch } from "@/services";

const EDIT_KEY = [...LISTINGS_KEY, "edit"] as const;

/**
 * Loads the developer's own full editable record for /listings/[id]/edit.
 * A separate query key from the My Properties table's [...LISTINGS_KEY, params] —
 * this fetches one record's full editable shape (address/amenities included),
 * not a filtered page of the list-view shape. Built from the same LISTINGS_KEY
 * root so an invalidation of the root key can't miss this branch.
 */
export function useListingForEdit(id: string) {
  return useQuery({
    queryKey: [...EDIT_KEY, id],
    queryFn: () => listingService.getListingForEdit(id),
  });
}

/**
 * No toast side effects here deliberately: this mutation backs both silent
 * autosave (useAutosaveListing) and the explicit "Save changes" action, which
 * want different user-facing feedback (none vs. a confirmation toast) — that
 * decision belongs to each caller, not baked into the mutation itself.
 */
export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: ListingPatch) => listingService.createListing(patch),
    onSuccess: (listing) => {
      queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
      queryClient.setQueryData([...EDIT_KEY, listing.slug], listing);
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ListingPatch }) =>
      listingService.updateListing(id, patch),
    onSuccess: (listing) => {
      queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
      queryClient.setQueryData([...EDIT_KEY, listing.id], listing);
    },
  });
}
