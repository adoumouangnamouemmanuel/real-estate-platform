import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DevelopersView } from "@/components/developer/DevelopersView";
import { developerService } from "@/services";
import { makeDeveloper } from "@/test/fixtures";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/developers",
}));

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return {
    ...actual,
    developerService: { getDevelopers: vi.fn() },
  };
});

const getDevelopers = vi.mocked(developerService.getDevelopers);

describe("Developer listing flow", () => {
  beforeEach(() => {
    push.mockClear();
    getDevelopers.mockReset();
  });

  it("shows a loading state, then the fetched developers", async () => {
    getDevelopers.mockResolvedValue({
      items: [makeDeveloper({ name: "Atlantic Properties" })],
      total: 1,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    });

    renderWithQueryClient(<DevelopersView filters={{ page: 1 }} />);

    expect(screen.getByRole("status")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("Atlantic Properties")).toBeInTheDocument(),
    );
  });

  it("shows the error state when the service call rejects", async () => {
    getDevelopers.mockRejectedValue(new Error("Service unavailable"));

    renderWithQueryClient(<DevelopersView filters={{ page: 1 }} />);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText("Service unavailable")).toBeInTheDocument();
  });

  it("shows the empty state when the service returns no developers", async () => {
    getDevelopers.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    });

    renderWithQueryClient(<DevelopersView filters={{ page: 1 }} />);

    await waitFor(() =>
      expect(screen.getByText("No developers found")).toBeInTheDocument(),
    );
  });

  it("navigates with the filter and a reset page when a filter is applied", async () => {
    const user = userEvent.setup();
    getDevelopers.mockResolvedValue({
      items: [makeDeveloper()],
      total: 1,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    });

    renderWithQueryClient(<DevelopersView filters={{ page: 2 }} />);
    await waitFor(() => expect(getDevelopers).toHaveBeenCalled());

    await user.selectOptions(screen.getByLabelText("Location"), "Kumasi");

    expect(push).toHaveBeenCalledWith("/developers?page=1&city=Kumasi", {
      scroll: false,
    });
  });
});
