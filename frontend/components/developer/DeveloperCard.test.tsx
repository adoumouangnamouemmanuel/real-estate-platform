import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeDeveloper } from "@/test/fixtures";

import { DeveloperCard } from "./DeveloperCard";

describe("DeveloperCard", () => {
  it("renders the developer's name, location, and listing count", () => {
    const developer = makeDeveloper({
      name: "Atlantic Properties",
      city: "Accra",
      region: "Greater Accra",
      activeListings: 6,
    });

    render(<DeveloperCard developer={developer} />);

    expect(screen.getByText("Atlantic Properties")).toBeInTheDocument();
    expect(screen.getByText("Accra, Greater Accra")).toBeInTheDocument();
    expect(screen.getByText("6 active listings")).toBeInTheDocument();
  });

  it("links to the developer's profile page by slug", () => {
    const developer = makeDeveloper({ slug: "atlantic-properties" });

    render(<DeveloperCard developer={developer} />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/developers/atlantic-properties",
    );
  });

  it("shows a Verified badge only when the developer is verified", () => {
    const { rerender } = render(
      <DeveloperCard developer={makeDeveloper({ isVerified: true })} />,
    );
    expect(screen.getByText("Verified")).toBeInTheDocument();

    rerender(
      <DeveloperCard developer={makeDeveloper({ isVerified: false })} />,
    );
    expect(screen.queryByText("Verified")).not.toBeInTheDocument();
  });

  it("renders the rating when present and omits it when absent", () => {
    const { rerender } = render(
      <DeveloperCard developer={makeDeveloper({ rating: 4.6 })} />,
    );
    expect(screen.getByText("4.6 / 5")).toBeInTheDocument();

    rerender(
      <DeveloperCard developer={makeDeveloper({ rating: undefined })} />,
    );
    expect(screen.queryByText(/\/ 5/)).not.toBeInTheDocument();
  });
});
