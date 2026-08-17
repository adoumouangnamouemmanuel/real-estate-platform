import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeDeveloper } from "@/test/fixtures";

import { DeveloperCard } from "./DeveloperCard";

describe("DeveloperCard", () => {
  it("renders the developer's name, location, and active listing count", () => {
    const developer = makeDeveloper({
      name: "Atlantic Properties",
      city: "Accra",
      region: "Greater Accra",
      activeListings: 6,
    });

    render(<DeveloperCard developer={developer} />);

    expect(screen.getByText("Atlantic Properties")).toBeInTheDocument();
    expect(screen.getByText("Accra, Greater Accra")).toBeInTheDocument();
    expect(screen.getByText("6 active")).toBeInTheDocument();
  });

  it("links to the developer's profile page by slug", () => {
    const developer = makeDeveloper({ slug: "atlantic-properties" });

    render(<DeveloperCard developer={developer} />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/developers/atlantic-properties",
    );
  });

  it("names the developer with a heading so the directory is navigable by structure", () => {
    render(
      <DeveloperCard developer={makeDeveloper({ name: "Goldcrest Homes" })} />,
    );

    expect(
      screen.getByRole("heading", { name: "Goldcrest Homes" }),
    ).toBeInTheDocument();
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
    expect(screen.getByText("4.6")).toBeInTheDocument();
    expect(screen.getByText("/ 5")).toBeInTheDocument();

    rerender(
      <DeveloperCard developer={makeDeveloper({ rating: undefined })} />,
    );
    expect(screen.queryByText("/ 5")).not.toBeInTheDocument();
  });

  /**
   * Data honesty: no `totalRatings`/review-count field exists anywhere in the
   * model, so the card must never imply how many ratings back the score.
   */
  it("never renders a rating count, which the data model does not have", () => {
    render(<DeveloperCard developer={makeDeveloper({ rating: 4.6 })} />);

    expect(screen.queryByText(/review/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rating[s]?\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
  });

  it("renders the bio as the card's editorial line when one is supplied", () => {
    render(
      <DeveloperCard
        developer={makeDeveloper()}
        bio="Builds gated communities across Greater Accra."
      />,
    );

    expect(
      screen.getByText("Builds gated communities across Greater Accra."),
    ).toBeInTheDocument();
  });

  it("renders without a bio, since the list DTO may not carry one", () => {
    const { container } = render(
      <DeveloperCard developer={makeDeveloper({ name: "Westgate" })} />,
    );

    expect(screen.getByText("Westgate")).toBeInTheDocument();
    expect(container.querySelector(".line-clamp-3")).not.toBeInTheDocument();
  });

  /**
   * There is no developer imagery in the data model, so identity is carried by
   * the monogram. It must be decorative-only: the accessible name already comes
   * from the heading, and "AP" announced before it would be noise.
   */
  it("shows a monogram identity mark that is hidden from assistive tech", () => {
    render(
      <DeveloperCard
        developer={makeDeveloper({ name: "Atlantic Properties" })}
      />,
    );

    const monogram = screen.getByText("AP");
    expect(monogram).toBeInTheDocument();
    expect(monogram).toHaveAttribute("aria-hidden");
  });

  it("does not render any image when the developer has no logo", () => {
    const { container } = render(
      <DeveloperCard developer={makeDeveloper({ logoUrl: undefined })} />,
    );

    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("exposes the CTA affordance to sighted users only, since the card is the link", () => {
    render(<DeveloperCard developer={makeDeveloper()} />);

    const link = screen.getByRole("link");
    // "View" is decorative — the card itself is the single focus stop.
    expect(within(link).getByText("View")).toHaveAttribute("aria-hidden");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
