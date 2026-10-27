"use client";

import { useContentLocale as useLanguage } from "@/hooks/useContentLocale";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch, type Control } from "react-hook-form";
import { toast } from "sonner";

import { NavigationGuardDialog } from "@/components/common/NavigationGuardDialog";
import { PropertyStatusBadge } from "@/components/dashboard/StatusBadge";
import { DeleteListingDialog } from "@/components/dashboard/listings/DeleteListingDialog";
import { ListingAmenitiesSection } from "@/components/dashboard/listings/ListingAmenitiesSection";
import { ListingBasicsSection } from "@/components/dashboard/listings/ListingBasicsSection";
import {
  ListingEditorProvider,
  useListingEditorContext,
  type ListingIdentity,
} from "@/components/dashboard/listings/ListingEditorProvider";
import { ListingLocationSection } from "@/components/dashboard/listings/ListingLocationSection";
import { ListingMeasurementsSection } from "@/components/dashboard/listings/ListingMeasurementsSection";
import { ListingPricingSection } from "@/components/dashboard/listings/ListingPricingSection";
import { ListingPublishBar } from "@/components/dashboard/listings/ListingPublishBar";
import { MediaUploader } from "@/components/dashboard/listings/MediaUploader";
import {
  useAutosaveListing,
  type AutosaveStatus,
} from "@/hooks/useAutosaveListing";
import { useCreateListing, useUpdateListing } from "@/hooks/useListingEditor";
import { useDeleteListing, useUpdateListingStatus } from "@/hooks/useListings";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import { ROUTES } from "@/constants/routes";
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
import type { Property, PropertyStatus } from "@/types";

/**
 * The editor header's status line: current listing status, always, plus one
 * gap the always-visible sticky action bar can't otherwise cover — the
 * moment right after a keystroke, before autosave has even started trying
 * (dirty, but still "idle"). Once autosave actually starts ("saving"),
 * fails ("error"), or the listing is clean, the sticky bar already shows
 * that same information every time it's on screen, so this line goes quiet
 * rather than repeating it in a second place with different wording.
 */
function ListingEditorStatusLine({
  status,
  isDirty,
  autosaveStatus,
}: {
  status: PropertyStatus;
  isDirty: boolean;
  autosaveStatus: AutosaveStatus;
}) {
  const showUnsaved = isDirty && autosaveStatus === "idle";

  return (
    <div className="flex items-center gap-2">
      <PropertyStatusBadge status={status} />
      {showUnsaved && (
        <span aria-live="polite" className="text-muted-foreground text-sm">
          Unsaved changes
        </span>
      )}
    </div>
  );
}

/**
 * Isolates the full-form `useWatch` subscription publish readiness needs
 * into its own leaf component. Subscribing at the `ListingFormInner` level
 * instead would re-render every section (including the heavier
 * `MediaUploader`) on every single keystroke, for no benefit — only this bar
 * needs the live values.
 */
function ListingPublishBarConnected({
  control,
  isDraft,
  ...rest
}: {
  control: Control<ListingFormValues>;
  isDraft: boolean;
} & Omit<React.ComponentProps<typeof ListingPublishBar>, "publishReadiness">) {
  const watchedValues = useWatch({ control }) as ListingFormValues;
  const publishReadiness = isDraft
    ? validateForPublish(watchedValues)
    : undefined;

  return (
    <ListingPublishBar
      isDraft={isDraft}
      publishReadiness={publishReadiness}
      {...rest}
    />
  );
}

interface ListingFormProps {
  mode: "create" | "edit";
  onDirtyChange?: (dirty: boolean) => void;
  listing?: Property;
  /** Overrides the default 2s autosave debounce — exists for tests, which use a short real delay instead of fake timers to avoid the well-documented fake-timer/userEvent interaction pitfalls. */
  autosaveDebounceMs?: number;
}

function toFormValues(listing?: Property): ListingFormValues {
  return {
    currencyCode: listing
      ? listing.currencyCode === "XOF"
        ? "XOF"
        : ""
      : "XOF",
    rentPeriod: (listing?.rentPeriod ??
      undefined) as ListingFormValues["rentPeriod"],
    title: listing?.title ?? "",
    description: listing?.description ?? "",
    price: listing?.price ? listing.price : undefined,
    listingType: listing?.listingType,
    category: listing?.category,
    cityId: listing?.cityId,
    districtId: listing?.districtId,
    city: listing?.city ?? "",
    district: listing?.district ?? "",
    region: listing?.region ?? "",
    address: listing?.address ?? "",
    amenities: listing?.featureIds ?? [],
    bedrooms: listing?.bedrooms,
    bathrooms: listing?.bathrooms,
    carSpaces: listing?.carSpaces,
    yearBuilt: listing?.yearBuilt,
    landSizeSqm: listing?.landSizeSqm,
    buildingSizeSqm: listing?.buildingSizeSqm,
    media: listing?.media ?? [],
  };
}

/**
 * Top-level orchestrator for both /listings/new and /listings/[id]/edit —
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
  onDirtyChange,
}: ListingFormProps) {
  return (
    <ListingEditorProvider
      mode={mode}
      initialIdentity={listing ? { id: listing.id, slug: listing.slug } : null}
    >
      <ListingFormInner
        listing={listing}
        onDirtyChange={onDirtyChange}
        autosaveDebounceMs={autosaveDebounceMs}
      />
    </ListingEditorProvider>
  );
}

function ListingFormInner({
  listing,
  autosaveDebounceMs,
  onDirtyChange,
}: {
  listing?: Property;
  onDirtyChange?: (dirty: boolean) => void;
  autosaveDebounceMs?: number;
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const [contentLanguage, setContentLanguage] = useState(
    listing?.requestedLanguage ?? language,
  );
  const version = useRef(listing?.rowVersion);
  const savedIdentity = useRef<ListingIdentity | null>(
    listing ? { id: listing.id, slug: listing.slug } : null,
  );
  const saveInFlight = useRef<Promise<ListingIdentity> | null>(null);
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

  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
  }, [form.formState.isDirty, onDirtyChange]);
  const selectedCityId = useWatch({ control: form.control, name: "cityId" });
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
   * `/listings/[id]/edit` are different leaf routes in the App Router, so a
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
    if (saveInFlight.current) {
      await saveInFlight.current;
      return persist(patch);
    }
    const run = async () => {
      const values = savedIdentity.current
        ? patch
        : { ...form.getValues(), ...patch };
      const { amenities, region: _region, currencyCode, ...fields } = values;
      void _region;
      const body = {
        ...fields,
        ...(currencyCode ? { currencyCode } : {}),
        contentLanguage,
        rowVersion: version.current,
        ...(amenities !== undefined ? { featureIds: amenities } : {}),
      } as ListingPatch;
      const result = savedIdentity.current
        ? await updateListing.mutateAsync({
            id: savedIdentity.current.id,
            patch: body,
          })
        : await createListing.mutateAsync(body);
      version.current = result.rowVersion;
      const identity = { id: result.id, slug: result.slug };
      savedIdentity.current = identity;
      setIdentity(identity);
      window.history.replaceState(null, "", ROUTES.EDIT_LISTING(result.id));
      return identity;
    };
    saveInFlight.current = run();
    try {
      return await saveInFlight.current;
    } finally {
      saveInFlight.current = null;
    }
  }

  const { status: autosaveStatus, saveNow } = useAutosaveListing({
    form,
    // Also disabled the instant Publish/Delete starts: both navigate away on
    // success, and a debounced autosave that was already scheduled (or, worse,
    // one whose network call was already in flight) could otherwise resolve
    // afterward and call router.replace back to the edit URL, undoing the
    // navigation the user just triggered. Gating `enabled` off here cancels
    // any not-yet-fired timer immediately (see useAutosaveListing's cleanup).
    enabled:
      isDraft && !!selectedCityId && !isPublishing && !deleteListing.isPending,
    onSave: persist,
    ...(autosaveDebounceMs !== undefined && { debounceMs: autosaveDebounceMs }),
  });

  useEffect(() => {
    setAutosaveStatus(autosaveStatus);
  }, [autosaveStatus, setAutosaveStatus]);

  // Blocks on any dirty state, draft or published: a draft is "dirty" only
  // for the brief window between a keystroke and the debounced autosave
  // actually firing (or failing), and leaving during exactly that window
  // would otherwise silently drop the change with no warning at all.
  const shouldBlockNavigation = form.formState.isDirty;

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
  async function handleSaveChanges() {
    return form.handleSubmit(async () => {
      setIsSavingExplicit(true);
      try {
        const snapshot = form.getValues();
        await persist(snapshot);
        // Clear dirty state only if the submitted snapshot still matches.
        // Changes typed during the save remain dirty and must be saved again.
        if (JSON.stringify(form.getValues()) === JSON.stringify(snapshot))
          form.reset(snapshot, { keepDirty: false });
        toast.success("Changes saved.");
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsSavingExplicit(false);
      }
    })();
  }

  async function handlePublish() {
    return form.handleSubmit(async (values) => {
      const validation = validateForPublish(values);
      if (!validation.success) {
        toast.error(validation.errors[0].message);
        return;
      }

      const submitted = form.getValues();
      const changed = (a: ListingFormValues, b: ListingFormValues) =>
        Object.keys({ ...a, ...b }).some(
          (key) =>
            JSON.stringify(a[key as keyof ListingFormValues]) !==
            JSON.stringify(b[key as keyof ListingFormValues]),
        );
      setIsPublishing(true);
      try {
        const savedIdentity = await persist(values);
        if (changed(form.getValues(), submitted))
          throw new Error(
            "New changes arrived while saving. Save and publish again.",
          );
        form.reset(values, { keepDirty: false });
        const published = await updateStatus.mutateAsync({
          id: savedIdentity.id,
          status: "ACTIVE",
        });
        version.current = published.rowVersion;
        if (changed(form.getValues(), values)) {
          toast.info("Published. Save the additional changes before leaving.");
          return;
        }
        router.push(ROUTES.LISTINGS);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsPublishing(false);
      }
    })();
  }

  async function handleStatusTransition(transition: StatusTransition) {
    if (currentStatus === "DRAFT" && transition.target === "ACTIVE") {
      await handlePublish();
      return;
    }
    if (!identity) return;
    const updated = await updateStatus.mutateAsync({
      id: identity.id,
      status: transition.target,
    });
    version.current = updated.rowVersion;
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
      <ListingEditorStatusLine
        status={currentStatus}
        isDirty={form.formState.isDirty}
        autosaveStatus={autosaveStatus}
      />

      {!listing && (
        <label>
          {language === "fr" ? "Langue du contenu" : "Content language"}{" "}
          <select
            aria-label="Content language"
            value={contentLanguage}
            disabled={!!identity}
            onChange={(e) => setContentLanguage(e.target.value)}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>
      )}
      {listing && (
        <button
          type="button"
          onClick={async () => {
            try {
              const identity = await persist(form.getValues());
              await api.post(
                `/developers/me/listings/${identity.id}/translations/${contentLanguage}/publish`,
              );
              toast.success(
                language === "fr"
                  ? "Traduction publiée."
                  : "Translation published.",
              );
            } catch (error) {
              toast.error(getErrorMessage(error));
            }
          }}
        >
          {language === "fr"
            ? "Publier cette traduction"
            : "Publish this translation"}
        </button>
      )}
      <form
        onSubmit={(event) => event.preventDefault()}
        className="flex flex-1 flex-col gap-6 pb-4 [&_[data-slot=card]]:overflow-visible"
      >
        <fieldset
          disabled={isPublishing || isSavingExplicit}
          className="contents"
        >
          <ListingBasicsSection />
          <ListingLocationSection />
          <ListingPricingSection />
          <ListingMeasurementsSection />
          <ListingAmenitiesSection />
          <MediaUploader />
        </fieldset>
      </form>

      <ListingPublishBarConnected
        control={form.control}
        isDraft={isDraft}
        status={currentStatus}
        autosaveStatus={autosaveStatus}
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
