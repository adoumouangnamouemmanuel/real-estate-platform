import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PropertiesView } from "@/components/property/PropertiesView";
import { propertyService } from "@/services";
import { makeProperty } from "@/test/fixtures";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/properties",
}));

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return {
    ...actual,
    propertyService: { getProperties: vi.fn() },
  };
});

const getProperties = vi.mocked(propertyService.getProperties);

describe("Property listing flow", () => {
  beforeEach(() => {
    push.mockClear();
    getProperties.mockReset();
  });

  it("shows a loading state, then the fetched properties", async () => {
    getProperties.mockResolvedValue({
      items: [makeProperty({ id: "p1", title: "East Legon Apartment" })],
      total: 1,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    });

    renderWithQueryClient(
      <PropertiesView filters={{ page: 1 }} heading="Properties" />,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("East Legon Apartment")).toBeInTheDocument(),
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the error state when the service call rejects", async () => {
    getProperties.mockRejectedValue(new Error("Network unreachable"));

    renderWithQueryClient(
      <PropertiesView filters={{ page: 1 }} heading="Properties" />,
    );

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText("Network unreachable")).toBeInTheDocument();
  });

  it("shows the empty state when the service returns no items", async () => {
    getProperties.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    });

    renderWithQueryClient(
      <PropertiesView filters={{ page: 1 }} heading="Properties" />,
    );

    await waitFor(() =>
      expect(screen.getByText("No properties found")).toBeInTheDocument(),
    );
  });

  it("navigates with the filter and a reset page when a filter is applied", async () => {
    const user = userEvent.setup();
    getProperties.mockResolvedValue({
      items: [makeProperty()],
      total: 1,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    });

    renderWithQueryClient(
      <PropertiesView
        filters={{ page: 2, city: "Accra" }}
        heading="Properties"
      />,
    );
    await waitFor(() => expect(getProperties).toHaveBeenCalled());

    await user.selectOptions(screen.getByLabelText("Category"), "apartment");

    expect(push).toHaveBeenCalledWith(
      "/properties?page=1&city=Accra&category=apartment",
      { scroll: false },
    );
  });

  it("navigates preserving filters when a pagination control is used", async () => {
    const user = userEvent.setup();
    getProperties.mockResolvedValue({
      items: [makeProperty()],
      total: 30,
      page: 1,
      pageSize: 12,
      totalPages: 3,
    });

    renderWithQueryClient(
      <PropertiesView
        filters={{ page: 1, category: "apartment" }}
        heading="Properties"
      />,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("navigation", { name: "Pagination" }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "2" }));

    expect(push).toHaveBeenCalledWith("/properties?page=2&category=apartment", {
      scroll: false,
    });
  });
});
