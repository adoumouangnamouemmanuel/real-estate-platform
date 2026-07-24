import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { listingService } from "@/services";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";

import { ListingsStatusSummary } from "./ListingsStatusSummary";

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return { ...actual, listingService: { getStatusCounts: vi.fn() } };
});

const getStatusCounts = vi.mocked(listingService.getStatusCounts);

const counts = {
  ACTIVE: 12,
  RESERVED: 3,
  SOLD: 4,
  DRAFT: 6,
  SUSPENDED: 3,
};

describe("ListingsStatusSummary", () => {
  beforeEach(() => getStatusCounts.mockReset());

  it("renders a count chip per status once counts resolve", async () => {
    getStatusCounts.mockResolvedValue(counts);

    renderWithQueryClient(
      <ListingsStatusSummary
        activeStatus={undefined}
        onSelectStatus={vi.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByText("12")).toBeInTheDocument());
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("selects a status when its chip is clicked", async () => {
    const user = userEvent.setup();
    const onSelectStatus = vi.fn();
    getStatusCounts.mockResolvedValue(counts);

    renderWithQueryClient(
      <ListingsStatusSummary
        activeStatus={undefined}
        onSelectStatus={onSelectStatus}
      />,
    );

    await waitFor(() => expect(screen.getByText("Draft")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Draft/ }));
    expect(onSelectStatus).toHaveBeenCalledWith("DRAFT");
  });

  it("marks the active status pressed, and clears it on a second click", async () => {
    const user = userEvent.setup();
    const onSelectStatus = vi.fn();
    getStatusCounts.mockResolvedValue(counts);

    renderWithQueryClient(
      <ListingsStatusSummary
        activeStatus="DRAFT"
        onSelectStatus={onSelectStatus}
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Draft/ })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );

    await user.click(screen.getByRole("button", { name: /Draft/ }));
    expect(onSelectStatus).toHaveBeenCalledWith(undefined);
  });
});
