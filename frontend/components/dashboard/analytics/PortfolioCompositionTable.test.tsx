import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PortfolioComposition } from "@/types";

import { PortfolioCompositionTable } from "./PortfolioCompositionTable";

const portfolio: PortfolioComposition = {
  totalListings: 3,
  byStatus: [
    { status: "ACTIVE", count: 2 },
    { status: "RESERVED", count: 0 },
    { status: "SOLD", count: 0 },
    { status: "DRAFT", count: 1 },
    { status: "SUSPENDED", count: 0 },
  ],
  byCategory: [
    { category: "apartment", count: 2 },
    { category: "house", count: 1 },
    { category: "land", count: 0 },
    { category: "commercial", count: 0 },
    { category: "office", count: 0 },
  ],
};

describe("PortfolioCompositionTable", () => {
  it("shows a loading skeleton", () => {
    render(<PortfolioCompositionTable portfolio={undefined} isLoading />);
    expect(screen.getByText("Portfolio Composition")).toBeInTheDocument();
  });

  it("shows the true-empty state when there are no properties at all", () => {
    render(
      <PortfolioCompositionTable
        portfolio={{ totalListings: 0, byStatus: [], byCategory: [] }}
        isLoading={false}
      />,
    );
    expect(screen.getByText("No properties yet")).toBeInTheDocument();
  });

  it("renders non-zero status and category breakdowns, omitting zero-count rows", () => {
    render(
      <PortfolioCompositionTable portfolio={portfolio} isLoading={false} />,
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.queryByText("Sold")).not.toBeInTheDocument();
    expect(screen.getByText("Apartments")).toBeInTheDocument();
    expect(screen.getByText("Houses")).toBeInTheDocument();
    expect(screen.queryByText("Land")).not.toBeInTheDocument();
  });

  it("shows each row's share of the total portfolio as a percentage", () => {
    render(
      <PortfolioCompositionTable portfolio={portfolio} isLoading={false} />,
    );

    // 2 of 3 total = 67%, 1 of 3 = 33% — appears for both the Active status
    // row and the Apartments category row (2 of 3 each).
    expect(screen.getAllByText("67%")).toHaveLength(2);
    expect(screen.getAllByText("33%")).toHaveLength(2);
  });
});
