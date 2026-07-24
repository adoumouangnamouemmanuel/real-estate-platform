import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ListingPublishBar } from "./ListingPublishBar";

const noop = {
  onStatusTransition: vi.fn(),
  onSaveChanges: vi.fn(),
  onRetrySave: vi.fn(),
  onDeleteRequest: vi.fn(),
  onBack: vi.fn(),
};

describe("ListingPublishBar", () => {
  it("shows the autosave status for a draft, not an explicit Save button", () => {
    render(
      <ListingPublishBar
        status="DRAFT"
        autosaveStatus="saved"
        isDraft
        isSaving={false}
        isTransitioning={false}
        transitions={[{ target: "ACTIVE", label: "Publish" }]}
        canDelete={false}
        {...noop}
      />,
    );

    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save changes" }),
    ).not.toBeInTheDocument();
  });

  it("shows an explicit Save button for a published listing, not an autosave status", () => {
    render(
      <ListingPublishBar
        status="ACTIVE"
        autosaveStatus="idle"
        isDraft={false}
        isSaving={false}
        isTransitioning={false}
        transitions={[{ target: "SUSPENDED", label: "Suspend" }]}
        canDelete={false}
        {...noop}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Save changes" }),
    ).toBeInTheDocument();
  });

  it("offers a Retry action when autosave has failed", async () => {
    const user = userEvent.setup();
    const onRetrySave = vi.fn();
    render(
      <ListingPublishBar
        status="DRAFT"
        autosaveStatus="error"
        isDraft
        isSaving={false}
        isTransitioning={false}
        transitions={[{ target: "ACTIVE", label: "Publish" }]}
        canDelete={false}
        {...noop}
        onRetrySave={onRetrySave}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetrySave).toHaveBeenCalled();
  });

  it("renders one button per available status transition, reading STATUS_TRANSITIONS labels verbatim", () => {
    render(
      <ListingPublishBar
        status="ACTIVE"
        autosaveStatus="idle"
        isDraft={false}
        isSaving={false}
        isTransitioning={false}
        transitions={[
          { target: "RESERVED", label: "Mark as Reserved" },
          { target: "SOLD", label: "Mark as Sold" },
          { target: "SUSPENDED", label: "Suspend" },
        ]}
        canDelete={false}
        {...noop}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Mark as Reserved" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mark as Sold" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suspend" })).toBeInTheDocument();
  });

  it("dispatches the chosen transition", async () => {
    const user = userEvent.setup();
    const onStatusTransition = vi.fn();
    render(
      <ListingPublishBar
        status="DRAFT"
        autosaveStatus="idle"
        isDraft
        isSaving={false}
        isTransitioning={false}
        transitions={[{ target: "ACTIVE", label: "Publish" }]}
        canDelete={false}
        {...noop}
        onStatusTransition={onStatusTransition}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Publish" }));
    expect(onStatusTransition).toHaveBeenCalledWith({
      target: "ACTIVE",
      label: "Publish",
    });
  });

  it("only shows Delete when canDelete is true", () => {
    const { rerender } = render(
      <ListingPublishBar
        status="DRAFT"
        autosaveStatus="idle"
        isDraft
        isSaving={false}
        isTransitioning={false}
        transitions={[]}
        canDelete={false}
        {...noop}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();

    rerender(
      <ListingPublishBar
        status="DRAFT"
        autosaveStatus="idle"
        isDraft
        isSaving={false}
        isTransitioning={false}
        transitions={[]}
        canDelete
        {...noop}
      />,
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("explains that a SOLD listing has no further transitions", () => {
    render(
      <ListingPublishBar
        status="SOLD"
        autosaveStatus="idle"
        isDraft={false}
        isSaving={false}
        isTransitioning={false}
        transitions={[]}
        canDelete={false}
        {...noop}
      />,
    );

    expect(
      screen.getByText("Sold listings can't be reopened."),
    ).toBeInTheDocument();
  });

  it("dispatches onBack when 'Back to My Properties' is clicked", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <ListingPublishBar
        status="DRAFT"
        autosaveStatus="idle"
        isDraft
        isSaving={false}
        isTransitioning={false}
        transitions={[]}
        canDelete={false}
        {...noop}
        onBack={onBack}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Back to My Properties" }),
    );
    expect(onBack).toHaveBeenCalled();
  });
});
