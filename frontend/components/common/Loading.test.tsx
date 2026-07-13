import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Loading } from "./Loading";

describe("Loading", () => {
  it("announces itself to assistive tech via a status role", () => {
    render(<Loading />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has accessible text for screen readers even though it's visually just a spinner", () => {
    render(<Loading />);

    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });
});
