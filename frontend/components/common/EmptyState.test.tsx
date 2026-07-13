import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="No results" />);

    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    render(<EmptyState title="No results" description="Try another search" />);

    expect(screen.getByText("Try another search")).toBeInTheDocument();
  });

  it("omits the description entirely when not provided", () => {
    const { container } = render(<EmptyState title="No results" />);

    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("renders the action slot", () => {
    render(
      <EmptyState title="No results" action={<button>Reset filters</button>} />,
    );

    expect(
      screen.getByRole("button", { name: "Reset filters" }),
    ).toBeInTheDocument();
  });
});
