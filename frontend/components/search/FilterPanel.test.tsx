import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FilterPanel } from "./FilterPanel";

describe("FilterPanel", () => {
  it("applies category changes immediately, without needing the Apply button", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<FilterPanel filters={{}} onApply={onApply} />);

    await user.selectOptions(screen.getByLabelText("Category"), "apartment");

    expect(onApply).toHaveBeenCalledWith({ category: "apartment" });
  });

  it("applies listing-type changes immediately", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<FilterPanel filters={{}} onApply={onApply} />);

    await user.selectOptions(screen.getByLabelText("Listing type"), "RENT");

    expect(onApply).toHaveBeenCalledWith({ listingType: "RENT" });
  });

  it("clears the listing-type filter back to showing both", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<FilterPanel filters={{ listingType: "RENT" }} onApply={onApply} />);

    await user.selectOptions(screen.getByLabelText("Listing type"), "");

    expect(onApply).toHaveBeenCalledWith({ listingType: undefined });
  });

  it("applies city changes immediately", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<FilterPanel filters={{}} onApply={onApply} />);

    await user.selectOptions(screen.getByLabelText("Location"), "Accra");

    expect(onApply).toHaveBeenCalledWith({ city: "Accra" });
  });

  // Sorting moved out to SortSelect (see SortSelect.test.tsx) — it reorders the
  // result set rather than filtering it, so it now sits above the grid with the
  // result count instead of inside this panel.
  it("does not render a sort control", () => {
    render(<FilterPanel filters={{}} onApply={vi.fn()} />);

    expect(screen.queryByLabelText("Sort by")).not.toBeInTheDocument();
  });

  it("only applies keyword and price on Apply, not per keystroke", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<FilterPanel filters={{}} onApply={onApply} />);

    await user.type(screen.getByLabelText("Keyword"), "East Legon");
    expect(onApply).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(onApply).toHaveBeenCalledWith({
      q: "East Legon",
      minPrice: undefined,
      maxPrice: undefined,
    });
  });

  it("submits numeric price bounds as numbers", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<FilterPanel filters={{}} onApply={onApply} />);

    await user.type(screen.getByLabelText("Min price"), "100000");
    await user.type(screen.getByLabelText("Max price"), "500000");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(onApply).toHaveBeenCalledWith({
      q: undefined,
      minPrice: 100000,
      maxPrice: 500000,
    });
  });

  it("pre-fills fields from the current filters", () => {
    render(
      <FilterPanel
        filters={{
          q: "Kumasi",
          category: "land",
          listingType: "SALE",
          city: "Kumasi",
          minPrice: 50000,
        }}
        onApply={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Keyword")).toHaveValue("Kumasi");
    expect(screen.getByLabelText("Category")).toHaveValue("land");
    expect(screen.getByLabelText("Listing type")).toHaveValue("SALE");
    expect(screen.getByLabelText("Location")).toHaveValue("Kumasi");
    expect(screen.getByLabelText("Min price")).toHaveValue(50000);
  });
});
