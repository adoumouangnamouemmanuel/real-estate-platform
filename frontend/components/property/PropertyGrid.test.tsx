import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeProperty } from "@/test/fixtures";

import { PropertyGrid } from "./PropertyGrid";

describe("PropertyGrid", () => {
  it("shows skeleton placeholders and an accessible loading announcement while loading", () => {
    render(<PropertyGrid properties={[]} isLoading isError={false} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading properties…")).toBeInTheDocument();
  });

  it("shows an error state and surfaces the error message instead of the grid", () => {
    render(
      <PropertyGrid
        properties={[]}
        isLoading={false}
        isError
        error={new Error("Network down")}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Couldn't load properties")).toBeInTheDocument();
    expect(screen.getByText("Network down")).toBeInTheDocument();
  });

  it("shows an empty state when there are no properties and nothing is loading or erroring", () => {
    render(<PropertyGrid properties={[]} isLoading={false} isError={false} />);

    expect(screen.getByText("No properties found")).toBeInTheDocument();
  });

  it("uses the custom empty description when provided", () => {
    render(
      <PropertyGrid
        properties={[]}
        isLoading={false}
        isError={false}
        emptyDescription="Try a different keyword or adjust your filters."
      />,
    );

    expect(
      screen.getByText("Try a different keyword or adjust your filters."),
    ).toBeInTheDocument();
  });

  it("renders a card per property when data is present", () => {
    const properties = [
      makeProperty({ id: "p1", title: "First Property" }),
      makeProperty({ id: "p2", title: "Second Property" }),
    ];

    render(
      <PropertyGrid
        properties={properties}
        isLoading={false}
        isError={false}
      />,
    );

    expect(screen.getByText("First Property")).toBeInTheDocument();
    expect(screen.getByText("Second Property")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("prioritizes the error state over loading and data", () => {
    render(
      <PropertyGrid
        properties={[makeProperty()]}
        isLoading
        isError
        error={new Error("boom")}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
