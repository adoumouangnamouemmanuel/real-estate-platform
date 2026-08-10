import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Eye } from "lucide-react";

import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("renders the label and value", () => {
    render(<StatCard label="Views this week" value={128} />);

    expect(screen.getByText("Views this week")).toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
  });

  it("renders an optional hint", () => {
    render(
      <StatCard
        label="Views this week"
        value={128}
        hint="Up from 96 last week"
      />,
    );

    expect(screen.getByText("Up from 96 last week")).toBeInTheDocument();
  });

  it("renders an optional icon", () => {
    const { container } = render(
      <StatCard label="Views this week" value={128} icon={Eye} />,
    );

    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("shows a skeleton instead of content while loading", () => {
    render(<StatCard label="Views this week" value={128} isLoading />);

    expect(screen.queryByText("Views this week")).not.toBeInTheDocument();
    expect(screen.queryByText("128")).not.toBeInTheDocument();
  });

  it("renders a sparkline only when trend data has more than one point", () => {
    const { container, rerender } = render(
      <StatCard label="Views this week" value={128} trend={[1]} />,
    );
    expect(container.querySelector("svg")).not.toBeInTheDocument();

    rerender(
      <StatCard label="Views this week" value={128} trend={[1, 4, 2]} />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("shows an honest 'not enough activity' note instead of a sparkline for a mostly-flat, near-zero trend", () => {
    const { container } = render(
      <StatCard
        label="Completed Viewings"
        value={2}
        trend={[0, 0, 0, 1, 0, 0, 0, 0, 0, 1]}
      />,
    );

    expect(container.querySelector("svg")).not.toBeInTheDocument();
    expect(screen.getByText(/Not enough/)).toBeInTheDocument();
  });
});
