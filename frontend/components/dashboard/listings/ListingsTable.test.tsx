import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { makeProperty } from "@/test/fixtures";
import type { Property } from "@/types";

import { ListingsTable } from "./ListingsTable";

const draft: Property = makeProperty({
  id: "d1",
  title: "Draft Listing",
  status: "DRAFT",
  updatedAt: "2026-07-20T10:00:00.000Z",
});
const active: Property = makeProperty({
  id: "a1",
  title: "Active Listing",
  status: "ACTIVE",
  updatedAt: "2026-07-22T10:00:00.000Z",
});
const sold: Property = makeProperty({
  id: "s1",
  title: "Sold Listing",
  status: "SOLD",
  updatedAt: "2026-07-15T10:00:00.000Z",
});

const noop = {
  onToggleRow: vi.fn(),
  onToggleAll: vi.fn(),
  onStatusChange: vi.fn(),
  onDeleteRequest: vi.fn(),
  onClearFilters: vi.fn(),
};

function renderTable(
  overrides: Partial<React.ComponentProps<typeof ListingsTable>> = {},
) {
  return render(
    <ListingsTable
      listings={[draft, active, sold]}
      isLoading={false}
      isError={false}
      selectedIds={new Set()}
      pendingIds={new Set()}
      hasActiveFilters={false}
      {...noop}
      {...overrides}
    />,
  );
}

describe("ListingsTable", () => {
  it("renders each listing's title, price, and status", () => {
    renderTable();

    expect(screen.getByText("Draft Listing")).toBeInTheDocument();
    expect(screen.getByText("Active Listing")).toBeInTheDocument();
    expect(screen.getByText("Sold Listing")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Sold")).toBeInTheDocument();
  });

  it("calls onToggleRow when a row checkbox is toggled", async () => {
    const user = userEvent.setup();
    const onToggleRow = vi.fn();
    renderTable({ onToggleRow });

    await user.click(screen.getByLabelText("Select Draft Listing"));
    expect(onToggleRow).toHaveBeenCalledWith("d1");
  });

  it("calls onToggleAll when the header checkbox is toggled", async () => {
    const user = userEvent.setup();
    const onToggleAll = vi.fn();
    renderTable({ onToggleAll });

    await user.click(screen.getByLabelText("Select all listings on this page"));
    expect(onToggleAll).toHaveBeenCalled();
  });

  it("only offers the transitions valid for a DRAFT listing, plus Delete", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByLabelText("Actions for Draft Listing"));

    expect(
      await screen.findByRole("menuitem", { name: "Publish" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Delete" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Mark as Sold" }),
    ).not.toBeInTheDocument();
  });

  it("links the row's direct Edit action to the property editor", () => {
    renderTable();

    expect(screen.getByLabelText("Edit Draft Listing")).toHaveAttribute(
      "href",
      "/listings/test-property/edit",
    );
  });

  it("offers no Delete action and no transitions for a SOLD (terminal) listing", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByLabelText("Actions for Sold Listing"));

    expect(
      await screen.findByRole("menuitem", { name: "View listing" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("dispatches onStatusChange with the chosen transition", async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    renderTable({ onStatusChange });

    await user.click(screen.getByLabelText("Actions for Active Listing"));
    await user.click(await screen.findByRole("menuitem", { name: "Suspend" }));

    expect(onStatusChange).toHaveBeenCalledWith(active, {
      target: "SUSPENDED",
      label: "Suspend",
    });
  });

  it("dispatches onDeleteRequest for a deletable listing", async () => {
    const user = userEvent.setup();
    const onDeleteRequest = vi.fn();
    renderTable({ onDeleteRequest });

    await user.click(screen.getByLabelText("Actions for Draft Listing"));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(onDeleteRequest).toHaveBeenCalledWith(draft);
  });

  it("disables a row's action trigger while it has a mutation pending", () => {
    renderTable({ pendingIds: new Set(["d1"]) });

    expect(screen.getByLabelText("Actions for Draft Listing")).toBeDisabled();
    expect(
      screen.getByLabelText("Actions for Active Listing"),
    ).not.toBeDisabled();
  });

  it("shows a loading skeleton", () => {
    renderTable({ isLoading: true, listings: [] });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows an error state with the given message", () => {
    // isError/error are plain props here (data-fetching lives in ListingsView),
    // so no React Query promise is involved — safe to assert synchronously,
    // unlike the connected hooks/widgets noted in TODO.md.
    renderTable({
      isError: true,
      listings: [],
      error: new Error("Network unreachable"),
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't load your properties.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Network unreachable");
  });

  it("shows the true-empty state when the portfolio has no listings at all", () => {
    renderTable({ listings: [], hasActiveFilters: false });
    expect(screen.getByText("No properties yet")).toBeInTheDocument();
  });

  it("shows the filtered-empty state with a clear-filters action when filters exclude everything", async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();
    renderTable({ listings: [], hasActiveFilters: true, onClearFilters });

    expect(
      screen.getByText("No listings match your filters"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClearFilters).toHaveBeenCalled();
  });
});
