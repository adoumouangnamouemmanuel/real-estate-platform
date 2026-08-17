import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { ListingForm } from "@/components/dashboard/listings/ListingForm";
import { listingService, uploadService } from "@/services";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";
import type { Property } from "@/types";

// Long enough that a real-timer userEvent.type() sequence reliably finishes
// before the debounce fires (a too-short value here made autosave's own
// re-render occasionally land mid-keystroke under load, dropping a
// character — a test-timing issue, not an application bug).
const DEBOUNCE_MS = 150;

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return {
    ...actual,
    listingService: {
      ...actual.listingService,
      createListing: vi.fn(),
      updateListing: vi.fn(),
      updateListingStatus: vi.fn(),
      deleteListing: vi.fn(),
    },
    uploadService: {
      uploadFile: vi.fn(),
      deleteUpload: vi.fn(),
    },
  };
});

const svc = vi.mocked(listingService);
const uploadFile = vi.mocked(uploadService.uploadFile);

function makePhotoFile() {
  return new File(["x"], "photo.jpg", { type: "image/jpeg" });
}

function makeDraft(overrides: Partial<Property> = {}): Property {
  return {
    id: "l1",
    slug: "my-listing",
    title: "My Listing",
    description: "",
    price: 0,
    listingType: "SALE",
    category: "apartment",
    city: "",
    region: "",
    status: "DRAFT",
    media: [],
    address: "",
    amenities: [],
    ...overrides,
  };
}

const completeDraft = makeDraft({
  description: "A lovely place.",
  price: 100000,
  listingType: "SALE",
  category: "apartment",
  city: "Accra",
  region: "Greater Accra",
  address: "1 Main Street",
  media: [{ url: "https://example.com/a.jpg", publicId: "a", order: 0 }],
});

describe("Property Editor (ListingForm, all flows composed)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new draft on first autosave and adopts its identity via a cosmetic URL update, not a real navigation", async () => {
    svc.createListing.mockResolvedValue(
      makeDraft({ id: "new-1", slug: "new-title" }),
    );
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    const user = userEvent.setup();

    renderWithQueryClient(
      <ListingForm mode="create" autosaveDebounceMs={DEBOUNCE_MS} />,
    );

    await user.type(screen.getByLabelText("Title"), "New Title");

    await waitFor(() => expect(svc.createListing).toHaveBeenCalled(), {
      timeout: 2000,
    });
    // history.replaceState, not router.replace: a real Next.js navigation
    // between /listings/new and /listings/[slug]/edit would unmount this
    // component (different leaf routes), discarding anything typed after the
    // autosave snapshot. See the comment on ListingForm's `persist`.
    expect(replaceStateSpy).toHaveBeenCalledWith(
      null,
      "",
      "/listings/new-title/edit",
    );
    expect(replace).not.toHaveBeenCalled();
    // The component is still the same mounted instance — the title field
    // still shows what was typed, proving no remount occurred.
    expect(screen.getByLabelText("Title")).toHaveValue("New Title");
  });

  it("PATCHes only the changed fields once a listing already exists", async () => {
    svc.updateListing.mockResolvedValue(makeDraft({ price: 5000 }));
    const user = userEvent.setup();

    renderWithQueryClient(
      <ListingForm
        mode="edit"
        listing={makeDraft()}
        autosaveDebounceMs={DEBOUNCE_MS}
      />,
    );

    await user.clear(screen.getByLabelText("Price"));
    await user.type(screen.getByLabelText("Price"), "5000");

    await waitFor(
      () =>
        expect(svc.updateListing).toHaveBeenCalledWith("my-listing", {
          price: 5000,
        }),
      { timeout: 2000 },
    );
    expect(svc.createListing).not.toHaveBeenCalled();
  });

  it("shows the autosave error status and a working Retry action", async () => {
    svc.updateListing.mockRejectedValue(new Error("network down"));
    const user = userEvent.setup();

    renderWithQueryClient(
      <ListingForm
        mode="edit"
        listing={makeDraft()}
        autosaveDebounceMs={DEBOUNCE_MS}
      />,
    );

    await user.clear(screen.getByLabelText("Price"));
    await user.type(screen.getByLabelText("Price"), "1");

    await waitFor(
      () => expect(screen.getByText("Couldn't save")).toBeInTheDocument(),
      {
        timeout: 2000,
      },
    );

    svc.updateListing.mockResolvedValue(makeDraft({ price: 1 }));
    await user.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.getByText("Saved")).toBeInTheDocument());
  });

  it("blocks Publish with a validation toast when the listing is incomplete", async () => {
    const errorSpy = vi.spyOn(toast, "error");
    const user = userEvent.setup();

    renderWithQueryClient(
      <ListingForm mode="create" autosaveDebounceMs={DEBOUNCE_MS} />,
    );

    // A title satisfies the form's own lenient (draft) validation, so the
    // click actually reaches the stricter publish-profile check rather than
    // being blocked earlier by the base resolver's own required-field rule.
    await user.type(screen.getByLabelText("Title"), "Incomplete Listing");
    await user.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => expect(errorSpy).toHaveBeenCalled());
    expect(svc.updateListingStatus).not.toHaveBeenCalled();
  });

  it("publishes a complete draft: saves, transitions to ACTIVE, and navigates back", async () => {
    svc.updateListing.mockResolvedValue(completeDraft);
    svc.updateListingStatus.mockResolvedValue({
      ...completeDraft,
      status: "ACTIVE",
    });
    const user = userEvent.setup();

    renderWithQueryClient(
      <ListingForm
        mode="edit"
        listing={completeDraft}
        autosaveDebounceMs={DEBOUNCE_MS}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() =>
      expect(svc.updateListingStatus).toHaveBeenCalledWith("l1", "ACTIVE"),
    );
    expect(push).toHaveBeenCalledWith("/listings");
  });

  it("publishes a never-yet-saved brand-new draft in one step, without an intermediate redirect stranding the flow", async () => {
    // Regression coverage: publishing a draft with no prior autosave used to
    // route through persist()'s router.replace to the edit URL — a full route
    // change that unmounts the component and orphans the rest of handlePublish
    // (the follow-up updateStatus + router.push("/listings") never ran).
    svc.createListing.mockResolvedValue(completeDraft);
    svc.updateListingStatus.mockResolvedValue({
      ...completeDraft,
      status: "ACTIVE",
    });
    uploadFile.mockResolvedValue({
      url: "https://example.com/a.jpg",
      publicId: "a",
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const user = userEvent.setup();

    renderWithQueryClient(
      <ListingForm mode="create" autosaveDebounceMs={DEBOUNCE_MS} />,
    );

    await user.type(screen.getByLabelText("Title"), completeDraft.title);
    await user.type(
      screen.getByLabelText("Description"),
      completeDraft.description,
    );
    await user.selectOptions(
      screen.getByLabelText("Category"),
      completeDraft.category,
    );
    await user.selectOptions(
      screen.getByLabelText("Listing type"),
      completeDraft.listingType,
    );
    // No Region step: selecting the city derives it (see
    // ListingLocationSection). Publishing succeeding without one is the point —
    // region is no longer a publish gate.
    await user.selectOptions(screen.getByLabelText("City"), completeDraft.city);
    await user.type(
      screen.getByLabelText("Address"),
      completeDraft.address as string,
    );
    await user.type(
      screen.getByLabelText("Price"),
      String(completeDraft.price),
    );
    fireEvent.change(screen.getByLabelText("Add photos"), {
      target: { files: [makePhotoFile()] },
    });
    await waitFor(() => expect(screen.getByText("Cover")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => expect(svc.createListing).toHaveBeenCalled());
    await waitFor(() =>
      expect(svc.updateListingStatus).toHaveBeenCalledWith(
        completeDraft.id,
        "ACTIVE",
      ),
    );
    expect(replace).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/listings");
  });

  it("shows an explicit Save button (not autosave) for a published listing, and saves on click", async () => {
    const active = makeDraft({ status: "ACTIVE" });
    svc.updateListing.mockResolvedValue(active);
    const user = userEvent.setup();

    renderWithQueryClient(
      <ListingForm
        mode="edit"
        listing={active}
        autosaveDebounceMs={DEBOUNCE_MS}
      />,
    );

    expect(screen.queryByText("Saved")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Price"));
    await user.type(screen.getByLabelText("Price"), "2000");

    // Give the (disabled) autosave path a chance to have fired if it were wrongly enabled.
    await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS * 3));
    expect(svc.updateListing).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(svc.updateListing).toHaveBeenCalled());
  });

  it("deletes a draft after confirmation and navigates back to My Properties", async () => {
    svc.deleteListing.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithQueryClient(
      <ListingForm
        mode="edit"
        listing={makeDraft()}
        autosaveDebounceMs={DEBOUNCE_MS}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("My Listing");

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(svc.deleteListing).toHaveBeenCalledWith("l1"));
    expect(push).toHaveBeenCalledWith("/listings");
  });

  it("guards navigation away from a published listing with unsaved changes", async () => {
    const active = makeDraft({ status: "ACTIVE" });
    const user = userEvent.setup();

    renderWithQueryClient(
      <ListingForm
        mode="edit"
        listing={active}
        autosaveDebounceMs={DEBOUNCE_MS}
      />,
    );

    await user.clear(screen.getByLabelText("Price"));
    await user.type(screen.getByLabelText("Price"), "9999");

    await user.click(
      screen.getByRole("button", { name: "Back to My Properties" }),
    );

    // Both the dialog's title and its description independently contain the
    // phrase "Leave without saving" — assert on the dialog as a whole rather
    // than a text query that would otherwise match two elements at once.
    expect(await screen.findByRole("dialog")).toHaveTextContent(
      /leave without saving/i,
    );
    expect(push).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Leave" }));
    expect(push).toHaveBeenCalledWith("/listings");
  });
});
