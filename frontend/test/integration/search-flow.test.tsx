import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PropertiesView } from "@/components/property/PropertiesView";
import { SearchBar } from "@/components/search/SearchBar";
import { parsePropertyFilters } from "@/lib/propertyFilters";
import { propertyService } from "@/services";
import { makeProperty } from "@/test/fixtures";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/search",
}));

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return {
    ...actual,
    propertyService: { getProperties: vi.fn() },
  };
});

const getProperties = vi.mocked(propertyService.getProperties);

describe("Search flow", () => {
  beforeEach(() => {
    push.mockClear();
    getProperties.mockReset();
  });

  it("SearchBar's query string round-trips through parsePropertyFilters into typed filters", () => {
    // Simulates the URL SearchBar would have produced: /search?q=Kumasi
    const filters = parsePropertyFilters({ q: "Kumasi" });

    expect(filters).toMatchObject({ q: "Kumasi", page: 1 });
  });

  it("ignores garbage query params rather than passing them to the service layer", () => {
    const filters = parsePropertyFilters({
      q: "Kumasi",
      category: "not-a-real-category",
      sort: "not-a-real-sort",
    });

    expect(filters.category).toBeUndefined();
    expect(filters.sort).toBeUndefined();
    expect(filters.q).toBe("Kumasi");
  });

  it("renders search results under a 'Search Results' heading using the parsed filters", async () => {
    getProperties.mockResolvedValue({
      items: [makeProperty({ city: "Kumasi", title: "Kumasi Apartment" })],
      total: 1,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    });

    renderWithQueryClient(
      <PropertiesView
        filters={parsePropertyFilters({ q: "Kumasi" })}
        heading="Search Results"
        emptyDescription="Try a different keyword or adjust your filters."
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Search Results" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(getProperties).toHaveBeenCalledWith({ q: "Kumasi", page: 1 }),
    );
    await waitFor(() =>
      expect(screen.getByText("Kumasi Apartment")).toBeInTheDocument(),
    );
  });

  it("shows the search-specific empty message for a no-match keyword", async () => {
    getProperties.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    });

    renderWithQueryClient(
      <PropertiesView
        filters={parsePropertyFilters({ q: "zzzznoresults" })}
        heading="Search Results"
        emptyDescription="Try a different keyword or adjust your filters."
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText("Try a different keyword or adjust your filters."),
      ).toBeInTheDocument(),
    );
  });

  it("SearchBar navigates to /search with the typed keyword", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<SearchBar />);

    await user.type(
      screen.getByLabelText("Search by city, neighborhood, or property name"),
      "Takoradi",
    );
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(push).toHaveBeenCalledWith("/search?q=Takoradi");
  });
});
