import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ErrorState } from "./ErrorState";

describe("ErrorState", () => {
  it("falls back to a generic title when none is given", () => {
    render(<ErrorState />);

    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("renders a custom title when provided", () => {
    render(<ErrorState title="Couldn't load properties" />);

    expect(screen.getByText("Couldn't load properties")).toBeInTheDocument();
  });

  it("announces itself to assistive tech via the alert role", () => {
    render(<ErrorState />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders the description and action when provided", () => {
    render(
      <ErrorState
        description="Network request failed"
        action={<button>Retry</button>}
      />,
    );

    expect(screen.getByText("Network request failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
