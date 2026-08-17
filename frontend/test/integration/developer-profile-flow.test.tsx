import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeveloperProfileView } from "@/components/developer/DeveloperProfileView";
import { makeDeveloperProfile, makeProperty } from "@/test/fixtures";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";

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

    renderWithQueryClient(
      <DeveloperProfileView
        developer={developer}
        activeListings={activeListings}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Atlantic Properties" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Building homes across Greater Accra since 2019."),
    ).toBeInTheDocument();
    expect(screen.getByText("hello@atlantic.example")).toBeInTheDocument();
    // The rating moved from a stat tile (one "4.6 / 5" node) into the identity
    // metadata row, where the value and the scale are separate nodes so the
    // number can carry its own emphasis. Still no count — no such field exists.
    expect(screen.getByText("4.6")).toBeInTheDocument();
    expect(screen.getByText("/ 5")).toBeInTheDocument();
    expect(screen.getByText("Active Listing")).toBeInTheDocument();
  });

  /**
   * The former "Featured Properties" section was removed: it rendered this
   * developer's own active properties sorted by price, presented as an
   * editorial selection the data cannot support (no `featured` field exists).
   * This asserts the duplicate section stays gone.
   */
  it("does not present a separate Featured Properties section", () => {
    renderWithQueryClient(
      <DeveloperProfileView
        developer={makeDeveloperProfile()}
        activeListings={[makeProperty({ title: "Only Listing" })]}
      />,
    );

    expect(
      screen.queryByRole("heading", { name: /Featured/i }),
    ).not.toBeInTheDocument();
    // The one property appears exactly once, not duplicated across sections.
    expect(screen.getAllByText("Only Listing")).toHaveLength(1);
  });

  it("only renders social links that the developer actually has", () => {
    const developer = makeDeveloperProfile({
      socialLinks: { website: "https://example.com" },
    });

    renderWithQueryClient(
      <DeveloperProfileView developer={developer} activeListings={[]} />,
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
    renderWithQueryClient(
      <DeveloperProfileView
        developer={makeDeveloperProfile()}
        activeListings={[]}
      />,
    );

    expect(screen.getByText("Map view coming soon")).toBeInTheDocument();
  });

  it("shows the empty-listings message when the developer has no active listings", () => {
    renderWithQueryClient(
      <DeveloperProfileView
        developer={makeDeveloperProfile()}
        activeListings={[]}
      />,
    );

    expect(
      screen.getByText("This developer has no active listings right now."),
    ).toBeInTheDocument();
  });
});
