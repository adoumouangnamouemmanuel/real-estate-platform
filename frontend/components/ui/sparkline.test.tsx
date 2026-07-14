import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Sparkline } from "./sparkline";

describe("Sparkline", () => {
  it("renders nothing for an empty series", () => {
    const { container } = render(<Sparkline data={[]} />);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("draws a flat line for a single point, without dividing by zero", () => {
    const { container } = render(<Sparkline data={[42]} />);
    const polyline = container.querySelector("polyline");

    expect(polyline).toBeInTheDocument();
    expect(polyline?.getAttribute("points")).not.toContain("NaN");
  });

  it("draws a flat line at mid-height when every value is equal", () => {
    const { container } = render(<Sparkline data={[5, 5, 5, 5]} />);
    const points = container.querySelector("polyline")?.getAttribute("points");

    expect(points).not.toContain("NaN");
    // Every y-coordinate should be the same (mid-height) for a flat series.
    const yValues = points?.split(" ").map((point) => point.split(",")[1]);
    expect(new Set(yValues).size).toBe(1);
  });

  it("normalizes a varied series into in-range viewBox coordinates", () => {
    const { container } = render(<Sparkline data={[1, 5, 2, 8, 3]} />);
    const points = container.querySelector("polyline")?.getAttribute("points");

    expect(points).not.toContain("NaN");
    expect(points?.split(" ")).toHaveLength(5);
  });

  it("is decorative by default (aria-hidden, no img role)", () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
  });

  it("exposes an accessible name when ariaLabel is given", () => {
    const { container } = render(
      <Sparkline data={[1, 2, 3]} ariaLabel="Views trend" />,
    );
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("role", "img");
    expect(svg).toHaveAttribute("aria-label", "Views trend");
  });
});
