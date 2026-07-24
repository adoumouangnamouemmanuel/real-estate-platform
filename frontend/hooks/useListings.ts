"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/errors";
import { listingService, type GetListingsParams } from "@/services";
import type { PropertyStatus } from "@/types";

export const LISTINGS_KEY = ["listings"] as const;

/** Keeps the previous page visible while the next page/filter loads, same as useProperties. */
export function useListings(params: GetListingsParams = {}) {
  return useQuery({
    queryKey: [...LISTINGS_KEY, params],
    queryFn: () => listingService.getListings(params),
    placeholderData: keepPreviousData,
  });
}

export function useListingStatusCounts() {
  return useQuery({
    queryKey: [...LISTINGS_KEY, "counts"],
    queryFn: () => listingService.getStatusCounts(),
  });
}

function useInvalidateListings() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
}

export function useUpdateListingStatus() {
  const invalidate = useInvalidateListings();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PropertyStatus }) =>
      listingService.updateListingStatus(id, status),
    onSuccess: (listing) => {
      invalidate();
      toast.success(`"${listing.title}" updated.`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteListing() {
  const invalidate = useInvalidateListings();

  return useMutation({
    mutationFn: (id: string) => listingService.deleteListing(id),
    onSuccess: () => {
      invalidate();
      toast.success("Listing deleted.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useBulkUpdateListingStatus() {
  const invalidate = useInvalidateListings();

  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: PropertyStatus }) =>
      listingService.bulkUpdateStatus(ids, status),
    onSuccess: ({ updated, skipped }) => {
      invalidate();
      if (skipped.length === 0) {
        toast.success(`${updated.length} listing(s) updated.`);
      } else {
        toast.warning(
          `${updated.length} updated, ${skipped.length} skipped (not eligible for that status).`,
        );
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useBulkDeleteListings() {
  const invalidate = useInvalidateListings();

  return useMutation({
    mutationFn: (ids: string[]) => listingService.bulkDelete(ids),
    onSuccess: ({ deleted, skipped }) => {
      invalidate();
      if (skipped.length === 0) {
        toast.success(`${deleted.length} listing(s) deleted.`);
      } else {
        toast.warning(
          `${deleted.length} deleted, ${skipped.length} skipped (not eligible for deletion).`,
        );
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
