import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  ListingEditorProvider,
  useListingEditorContext,
} from "./ListingEditorProvider";

function Probe() {
  const { mode, identity, setIdentity, autosaveStatus, isPublishing } =
    useListingEditorContext();
  return (
    <div>
      <span>mode:{mode}</span>
      <span>identity:{identity ? identity.slug : "none"}</span>
      <span>autosave:{autosaveStatus}</span>
      <span>publishing:{String(isPublishing)}</span>
      <button
        type="button"
        onClick={() => setIdentity({ id: "1", slug: "new-slug" })}
      >
        Set identity
      </button>
    </div>
  );
}

describe("ListingEditorProvider", () => {
  it("throws when used outside a provider", () => {
    // Swallow the expected console.error React logs for this render failure.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(
      /must be used within a ListingEditorProvider/,
    );
    spy.mockRestore();
  });

  it("exposes the initial mode and identity", () => {
    render(
      <ListingEditorProvider
        mode="edit"
        initialIdentity={{ id: "1", slug: "a" }}
      >
        <Probe />
      </ListingEditorProvider>,
    );

    expect(screen.getByText("mode:edit")).toBeInTheDocument();
    expect(screen.getByText("identity:a")).toBeInTheDocument();
  });

  it("starts with no identity for a brand-new draft", () => {
    render(
      <ListingEditorProvider mode="create" initialIdentity={null}>
        <Probe />
      </ListingEditorProvider>,
    );

    expect(screen.getByText("identity:none")).toBeInTheDocument();
  });

  it("setIdentity updates the identity for consumers", async () => {
    const user = userEvent.setup();
    render(
      <ListingEditorProvider mode="create" initialIdentity={null}>
        <Probe />
      </ListingEditorProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Set identity" }));
    expect(screen.getByText("identity:new-slug")).toBeInTheDocument();
  });
});
