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

/**
 * The input is deliberately borderless and transparent so the bar reads as one
 * control, which meant a keyboard user got no visible focus at all on the
 * homepage's primary action (WCAG 2.4.7). The indicator therefore lives on the
 * wrapper via `focus-within`, using the same ring the rest of the app uses.
 * The glass variant sits over hero imagery where the teal ring has too little
 * contrast, so it gets a white ring instead.
 */
describe("focus visibility", () => {
  it("puts a focus ring on the wrapper, since the focused element is the child input", () => {
    const { container } = render(<SearchBar />);
    const form = container.querySelector("form");

    expect(form?.className).toContain("focus-within:ring-3");
    expect(form?.className).toContain("focus-within:ring-ring/50");
  });

  it("uses a white ring on the glass variant for contrast over imagery", () => {
    const { container } = render(<SearchBar variant="glass" />);
    const form = container.querySelector("form");

    expect(form?.className).toContain("focus-within:ring-3");
    expect(form?.className).toContain("focus-within:ring-white/70");
  });
});
