"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { NavigationGuardDialog } from "@/components/common/NavigationGuardDialog";
import { DeleteListingDialog } from "@/components/dashboard/listings/DeleteListingDialog";
import { ListingAmenitiesSection } from "@/components/dashboard/listings/ListingAmenitiesSection";
import { ListingBasicsSection } from "@/components/dashboard/listings/ListingBasicsSection";
import {
  ListingEditorProvider,
  useListingEditorContext,
  type ListingIdentity,
} from "@/components/dashboard/listings/ListingEditorProvider";
import { ListingLocationSection } from "@/components/dashboard/listings/ListingLocationSection";
import { ListingPricingSection } from "@/components/dashboard/listings/ListingPricingSection";
import { ListingPublishBar } from "@/components/dashboard/listings/ListingPublishBar";
import { MediaUploader } from "@/components/dashboard/listings/MediaUploader";
import { ROUTES } from "@/constants/routes";
import { useAutosaveListing } from "@/hooks/useAutosaveListing";
import { useCreateListing, useUpdateListing } from "@/hooks/useListingEditor";
import { useDeleteListing, useUpdateListingStatus } from "@/hooks/useListings";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import { getErrorMessage } from "@/lib/errors";
import {
  listingSchema,
  validateForPublish,
  type ListingFormValues,
} from "@/lib/validation/listing";
import {
  canDeleteListing,
  getAvailableTransitions,
  type ListingPatch,
  type StatusTransition,
} from "@/services";
import type { Property } from "@/types";

interface ListingFormProps {
  mode: "create" | "edit";
  listing?: Property;
  /** Overrides the default 2s autosave debounce — exists for tests, which use a short real delay instead of fake timers to avoid the well-documented fake-timer/userEvent interaction pitfalls. */
  autosaveDebounceMs?: number;
}

function toFormValues(listing?: Property): ListingFormValues {
  return {
    title: listing?.title ?? "",
    description: listing?.description ?? "",
    price: listing?.price ? listing.price : undefined,
    listingType: listing?.listingType,
    category: listing?.category,
    city: listing?.city ?? "",
    region: listing?.region ?? "",
    address: listing?.address ?? "",
    amenities: listing?.amenities ?? [],
    media: listing?.media ?? [],
  };
}

/**
 * Top-level orchestrator for both /listings/new and /listings/[slug]/edit —
 * one component, parameterized by mode, since the fields are identical and
 * only the initial values / submit semantics differ. Sets up the single React
 * Hook Form instance (the source of truth for field values, shared with every
 * section via FormProvider) and wraps it in ListingEditorProvider (cross-
 * cutting editor metadata — identity, autosave status, publish-in-flight —
 * that isn't itself a form field).
 */
export function ListingForm({
  mode,
  listing,
  autosaveDebounceMs,
}: ListingFormProps) {
  return (
    <ListingEditorProvider
      mode={mode}
      initialIdentity={listing ? { id: listing.id, slug: listing.slug } : null}
    >
      <ListingFormInner
        listing={listing}
        autosaveDebounceMs={autosaveDebounceMs}
      />
    </ListingEditorProvider>
  );
}

function ListingFormInner({
  listing,
  autosaveDebounceMs,
}: {
  listing?: Property;
  autosaveDebounceMs?: number;
}) {
  const router = useRouter();
  const {
    identity,
    setIdentity,
    isPublishing,
    setIsPublishing,
    setAutosaveStatus,
  } = useListingEditorContext();

  const [isSavingExplicit, setIsSavingExplicit] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: toFormValues(listing),
  });

  const createListing = useCreateListing();
  const updateListing = useUpdateListing();
  const updateStatus = useUpdateListingStatus();
  const deleteListing = useDeleteListing();

  const currentStatus = listing?.status ?? "DRAFT";
  const isDraft = currentStatus === "DRAFT";

  /**
   * The single write path for both autosave and explicit save: creates the
   * listing on its very first save (adopting the id/slug it mints) or PATCHes
   * the existing one.
   *
   * The address bar is updated to the real edit URL via `history.replaceState`
   * directly — deliberately NOT `router.replace()`. `/listings/new` and
   * `/listings/[slug]/edit` are different leaf routes in the App Router, so a
   * real `router.replace()` navigation between them unmounts this component
   * and remounts a fresh one from the server-fetched listing, discarding
   * whatever the developer typed after the autosave snapshot that triggered
   * the create and orphaning any in-flight continuation (e.g. handlePublish's
   * follow-up status update). A plain History API call only fixes up what a
   * refresh or copy-pasted link would land on — it never touches React or
   * Next's router, so this component keeps running uninterrupted.
   */
  async function persist(
    patch: Partial<ListingFormValues>,
  ): Promise<ListingIdentity> {
    if (!identity) {
      const created = await createListing.mutateAsync(patch as ListingPatch);
      const newIdentity = { id: created.id, slug: created.slug };
      setIdentity(newIdentity);
      window.history.replaceState(null, "", ROUTES.EDIT_LISTING(created.slug));
      return newIdentity;
    }

    const updated = await updateListing.mutateAsync({
      slug: identity.slug,
      patch: patch as ListingPatch,
    });
    return { id: updated.id, slug: updated.slug };
  }

  const { status: autosaveStatus, saveNow } = useAutosaveListing({
    form,
    // Also disabled the instant Publish/Delete starts: both navigate away on
    // success, and a debounced autosave that was already scheduled (or, worse,
    // one whose network call was already in flight) could otherwise resolve
    // afterward and call router.replace back to the edit URL, undoing the
    // navigation the user just triggered. Gating `enabled` off here cancels
    // any not-yet-fired timer immediately (see useAutosaveListing's cleanup).
    enabled: isDraft && !isPublishing && !deleteListing.isPending,
    onSave: persist,
    ...(autosaveDebounceMs !== undefined && { debounceMs: autosaveDebounceMs }),
  });

  useEffect(() => {
    setAutosaveStatus(autosaveStatus);
  }, [autosaveStatus, setAutosaveStatus]);

  // Drafts only block navigation while a save is actually in flight or has
  // failed — autosave otherwise means there's rarely anything meaningfully
  // unsaved. Published listings (explicit-save mode) block on any dirty state.
  const shouldBlockNavigation = isDraft
    ? form.formState.isDirty &&
      (autosaveStatus === "saving" || autosaveStatus === "error")
    : form.formState.isDirty;

  const {
    isDialogOpen: isNavGuardOpen,
    message: navGuardMessage,
    guardNavigation,
    confirmNavigation,
    cancelNavigation,
  } = useNavigationGuard({ shouldBlock: shouldBlockNavigation });

  function handleBack() {
    guardNavigation(() => router.push(ROUTES.LISTINGS));
  }

  // Both actions read the form's values through form.handleSubmit — the
  // react-hook-form-idiomatic way to get the current values, and it also
  // re-runs the (lenient) draft schema first so a stray invalid value can't
  // slip through to persist().
  const handleSaveChanges = form.handleSubmit(async () => {
    setIsSavingExplicit(true);
    try {
      await persist(form.getValues());
      // form.getValues() read fresh here, not the `values` this callback
      // received: react-hook-form's isDirty compares against whatever
      // baseline reset()'s first argument supplies, so this both clears the
      // dirty flags AND folds in anything the developer typed during the
      // save's network await into the new "clean" baseline, rather than
      // reverting to a pre-await snapshot.
      form.reset(form.getValues(), { keepDirty: false });
      toast.success("Changes saved.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSavingExplicit(false);
    }
  });

  const handlePublish = form.handleSubmit(async (values) => {
    const validation = validateForPublish(values);
    if (!validation.success) {
      toast.error(validation.errors[0]);
      return;
    }

    setIsPublishing(true);
    try {
      const savedIdentity = await persist(values);
      form.reset(form.getValues(), { keepDirty: false });
      await updateStatus.mutateAsync({
        id: savedIdentity.id,
        status: "ACTIVE",
      });
      router.push(ROUTES.LISTINGS);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsPublishing(false);
    }
  });

  async function handleStatusTransition(transition: StatusTransition) {
    if (currentStatus === "DRAFT" && transition.target === "ACTIVE") {
      await handlePublish();
      return;
    }
    if (!identity) return;
    await updateStatus.mutateAsync({
      id: identity.id,
      status: transition.target,
    });
  }

  async function handleConfirmDelete() {
    if (identity) {
      await deleteListing.mutateAsync(identity.id);
    }
    setIsDeleteDialogOpen(false);
    router.push(ROUTES.LISTINGS);
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => event.preventDefault()}
        className="flex flex-col gap-6 pb-4"
      >
        <ListingBasicsSection />
        <ListingLocationSection />
        <ListingPricingSection />
        <ListingAmenitiesSection />
        <MediaUploader />
      </form>

      <ListingPublishBar
        status={currentStatus}
        autosaveStatus={autosaveStatus}
        isDraft={isDraft}
        isSaving={isSavingExplicit}
        isTransitioning={updateStatus.isPending || isPublishing}
        transitions={getAvailableTransitions(currentStatus)}
        canDelete={!!identity && canDeleteListing(currentStatus)}
        onStatusTransition={handleStatusTransition}
        onSaveChanges={handleSaveChanges}
        onRetrySave={saveNow}
        onDeleteRequest={() => setIsDeleteDialogOpen(true)}
        onBack={handleBack}
      />

      {isDeleteDialogOpen && (
        <DeleteListingDialog
          open
          onOpenChange={setIsDeleteDialogOpen}
          target={{ title: form.getValues("title") || "this listing" }}
          onConfirm={handleConfirmDelete}
          isPending={deleteListing.isPending}
        />
      )}

      <NavigationGuardDialog
        open={isNavGuardOpen}
        message={navGuardMessage}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />
    </FormProvider>
  );
}
