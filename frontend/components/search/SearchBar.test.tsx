import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SearchBar } from "./SearchBar";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("SearchBar", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("has an accessible label even though the input relies on a placeholder visually", () => {
    render(<SearchBar />);

    expect(
      screen.getByLabelText("Search by city, neighborhood, or property name"),
    ).toBeInTheDocument();
  });

  it("navigates to /search with the query on submit", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(
      screen.getByLabelText("Search by city, neighborhood, or property name"),
      "Kumasi",
    );
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(push).toHaveBeenCalledWith("/search?q=Kumasi");
  });

  it("navigates to /search with no query string when the input is empty", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(push).toHaveBeenCalledWith("/search");
  });

  it("trims whitespace and URL-encodes the query", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.type(
      screen.getByLabelText("Search by city, neighborhood, or property name"),
      "  East Legon  ",
    );
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(push).toHaveBeenCalledWith("/search?q=East%20Legon");
  });
});
