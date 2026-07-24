import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ListingsView } from "@/components/dashboard/listings/ListingsView";
import { listingService } from "@/services";
import { makeProperty } from "@/test/fixtures";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";
import type { GetListingsParams } from "@/services";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/listings",
}));

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return {
    ...actual,
    listingService: {
      getListings: vi.fn(),
      getStatusCounts: vi.fn(),
      updateListingStatus: vi.fn(),
      deleteListing: vi.fn(),
      bulkUpdateStatus: vi.fn(),
      bulkDelete: vi.fn(),
    },
  };
});

const svc = vi.mocked(listingService);

const draft = makeProperty({
  id: "d1",
  title: "Draft Listing",
  status: "DRAFT",
  updatedAt: "2026-07-20T10:00:00.000Z",
});
const active = makeProperty({
  id: "a1",
  title: "Active Listing",
  status: "ACTIVE",
  updatedAt: "2026-07-22T10:00:00.000Z",
});

const counts = { ACTIVE: 1, RESERVED: 0, SOLD: 0, DRAFT: 1, SUSPENDED: 0 };
const defaultFilters: GetListingsParams = { page: 1, pageSize: 10 };

function paginated(items = [draft, active]) {
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  };
}

describe("My Properties (ListingsView, all flows composed)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    svc.getStatusCounts.mockResolvedValue(counts);
    svc.getListings.mockResolvedValue(paginated());
  });

  it("renders the portfolio once it resolves", async () => {
    renderWithQueryClient(<ListingsView filters={defaultFilters} />);

    await waitFor(() =>
      expect(screen.getByText("Draft Listing")).toBeInTheDocument(),
    );
    expect(screen.getByText("Active Listing")).toBeInTheDocument();
  });

  it("shows the table's error state when the fetch rejects", async () => {
    svc.getListings.mockRejectedValue(new Error("Network unreachable"));

    renderWithQueryClient(<ListingsView filters={defaultFilters} />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Couldn't load your properties.",
      ),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Network unreachable");
  });

  it("shows the true-empty state when the portfolio is empty", async () => {
    svc.getListings.mockResolvedValue(paginated([]));

    renderWithQueryClient(<ListingsView filters={defaultFilters} />);

    await waitFor(() =>
      expect(screen.getByText("No properties yet")).toBeInTheDocument(),
    );
  });

  it("navigates with a reset page when a filter is applied", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <ListingsView filters={{ ...defaultFilters, page: 2 }} />,
    );
    await waitFor(() => expect(svc.getListings).toHaveBeenCalled());

    await user.selectOptions(screen.getByLabelText("Status"), "DRAFT");

    expect(push).toHaveBeenCalledWith(
      "/listings?page=1&pageSize=10&status=DRAFT",
      { scroll: false },
    );
  });

  it("navigates preserving filters when a pagination control is used", async () => {
    const user = userEvent.setup();
    svc.getListings.mockResolvedValue({
      items: [draft],
      total: 20,
      page: 1,
      pageSize: 10,
      totalPages: 2,
    });

    renderWithQueryClient(
      <ListingsView filters={{ ...defaultFilters, status: "DRAFT" }} />,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("navigation", { name: "Pagination" }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "2" }));

    expect(push).toHaveBeenCalledWith(
      "/listings?page=2&pageSize=10&status=DRAFT",
      { scroll: false },
    );
  });

  it("changes a single listing's status from its row action menu", async () => {
    const user = userEvent.setup();
    svc.updateListingStatus.mockResolvedValue({ ...draft, status: "ACTIVE" });

    renderWithQueryClient(<ListingsView filters={defaultFilters} />);
    await waitFor(() =>
      expect(screen.getByText("Draft Listing")).toBeInTheDocument(),
    );

    await user.click(screen.getByLabelText("Actions for Draft Listing"));
    await user.click(await screen.findByRole("menuitem", { name: "Publish" }));

    await waitFor(() =>
      expect(svc.updateListingStatus).toHaveBeenCalledWith("d1", "ACTIVE"),
    );
  });

  it("deletes a single listing after confirmation, and does nothing on cancel", async () => {
    const user = userEvent.setup();
    svc.deleteListing.mockResolvedValue(undefined);

    renderWithQueryClient(<ListingsView filters={defaultFilters} />);
    await waitFor(() =>
      expect(screen.getByText("Draft Listing")).toBeInTheDocument(),
    );

    await user.click(screen.getByLabelText("Actions for Draft Listing"));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "Draft Listing",
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(svc.deleteListing).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Actions for Draft Listing"));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(svc.deleteListing).toHaveBeenCalledWith("d1"));
  });

  it("bulk-updates the selected rows and clears the selection on success", async () => {
    const user = userEvent.setup();
    svc.bulkUpdateStatus.mockResolvedValue({ updated: ["d1"], skipped: [] });

    renderWithQueryClient(<ListingsView filters={defaultFilters} />);
    await waitFor(() =>
      expect(screen.getByText("Draft Listing")).toBeInTheDocument(),
    );

    await user.click(screen.getByLabelText("Select Draft Listing"));
    expect(screen.getByText("1 selected")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Publish / Reopen" }));

    await waitFor(() =>
      expect(svc.bulkUpdateStatus).toHaveBeenCalledWith(["d1"], "ACTIVE"),
    );
    await waitFor(() =>
      expect(screen.queryByText("1 selected")).not.toBeInTheDocument(),
    );
  });

  it("bulk-deletes the selected rows after confirmation", async () => {
    const user = userEvent.setup();
    svc.bulkDelete.mockResolvedValue({ deleted: ["d1"], skipped: [] });

    renderWithQueryClient(<ListingsView filters={defaultFilters} />);
    await waitFor(() =>
      expect(screen.getByText("Draft Listing")).toBeInTheDocument(),
    );

    await user.click(screen.getByLabelText("Select Draft Listing"));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("dialog")).toHaveTextContent("1");
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(svc.bulkDelete).toHaveBeenCalledWith(["d1"]));
  });
});
