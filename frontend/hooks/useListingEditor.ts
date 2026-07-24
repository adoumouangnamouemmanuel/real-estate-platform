"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listingService, type ListingPatch } from "@/services";

/**
 * Loads the developer's own full editable record for /listings/[slug]/edit.
 * A separate query key from the My Properties table's ["listings", params] —
 * this fetches one record's full editable shape (address/amenities included),
 * not a filtered page of the list-view shape.
 */
export function useListingForEdit(slug: string) {
  return useQuery({
    queryKey: ["listings", "edit", slug],
    queryFn: () => listingService.getListingForEdit(slug),
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
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.setQueryData(["listings", "edit", listing.slug], listing);
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, patch }: { slug: string; patch: ListingPatch }) =>
      listingService.updateListing(slug, patch),
    onSuccess: (listing) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.setQueryData(["listings", "edit", listing.slug], listing);
    },
  });
}
