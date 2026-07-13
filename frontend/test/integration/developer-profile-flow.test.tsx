import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeveloperProfileView } from "@/components/developer/DeveloperProfileView";
import { makeDeveloperProfile, makeProperty } from "@/test/fixtures";

describe("Developer profile flow", () => {
  it("renders bio, stats, contact, and active listings together", () => {
    const developer = makeDeveloperProfile({
      name: "Atlantic Properties",
      bio: "Building homes across Greater Accra since 2019.",
      email: "hello@atlantic.example",
      activeListings: 6,
      totalListings: 9,
      yearsActive: 6,
      rating: 4.6,
    });
    const activeListings = [
      makeProperty({ id: "p1", title: "Active Listing" }),
    ];

    render(
      <DeveloperProfileView
        developer={developer}
        activeListings={activeListings}
        featuredListings={[]}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Atlantic Properties" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Building homes across Greater Accra since 2019."),
    ).toBeInTheDocument();
    expect(screen.getByText("hello@atlantic.example")).toBeInTheDocument();
    expect(screen.getByText("4.6 / 5")).toBeInTheDocument();
    expect(screen.getByText("Active Listing")).toBeInTheDocument();
  });

  it("renders Featured Properties only when there are featured listings", () => {
    const developer = makeDeveloperProfile();

    const { rerender } = render(
      <DeveloperProfileView
        developer={developer}
        activeListings={[]}
        featuredListings={[]}
      />,
    );
    expect(
      screen.queryByRole("heading", { name: "Featured Properties" }),
    ).not.toBeInTheDocument();

    rerender(
      <DeveloperProfileView
        developer={developer}
        activeListings={[]}
        featuredListings={[makeProperty({ title: "Top Listing" })]}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Featured Properties" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Top Listing")).toBeInTheDocument();
  });

  it("only renders social links that the developer actually has", () => {
    const developer = makeDeveloperProfile({
      socialLinks: { website: "https://example.com" },
    });

    render(
      <DeveloperProfileView
        developer={developer}
        activeListings={[]}
        featuredListings={[]}
      />,
    );

    expect(screen.getByRole("link", { name: /Website/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Facebook/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Instagram/ }),
    ).not.toBeInTheDocument();
  });

  it("shows the map placeholder while FEATURES.MAP_VIEW is off", () => {
    render(
      <DeveloperProfileView
        developer={makeDeveloperProfile()}
        activeListings={[]}
        featuredListings={[]}
      />,
    );

    expect(screen.getByText("Map view coming soon")).toBeInTheDocument();
  });

  it("shows the empty-listings message when the developer has no active listings", () => {
    render(
      <DeveloperProfileView
        developer={makeDeveloperProfile()}
        activeListings={[]}
        featuredListings={[]}
      />,
    );

    expect(
      screen.getByText("This developer has no active listings right now."),
    ).toBeInTheDocument();
  });
});
