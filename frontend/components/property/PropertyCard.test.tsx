import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { makeProperty } from "@/test/fixtures";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";

import { PropertyCard } from "./PropertyCard";

describe("PropertyCard", () => {
  // favoriteService persists to localStorage (see services/favorite.service.ts) —
  // clear it so one test's toggle can't leak into the next.
  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders title, location, and formatted price", () => {
    const property = makeProperty({
      title: "Luxury 3BR Apartment",
      city: "Accra",
      region: "Greater Accra",
      price: 450000,
    });

    renderWithQueryClient(<PropertyCard property={property} />);

    expect(screen.getByText("Luxury 3BR Apartment")).toBeInTheDocument();
    expect(screen.getByText("Accra, Greater Accra")).toBeInTheDocument();
    expect(screen.getByText("GHS 450,000")).toBeInTheDocument();
  });

  it("links to the property's detail page by slug", () => {
    const property = makeProperty({ slug: "my-test-slug" });

    renderWithQueryClient(<PropertyCard property={property} />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/properties/my-test-slug",
    );
  });

  it.each([
    ["SALE", "For Sale"],
    ["RENT", "For Rent"],
  ] as const)("shows '%s' listings as '%s'", (listingType, label) => {
    renderWithQueryClient(
      <PropertyCard property={makeProperty({ listingType })} />,
    );

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("shows a fallback icon instead of an image when there's no media", () => {
    const property = makeProperty({ media: [] });

    renderWithQueryClient(<PropertyCard property={property} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders an image with the property title as alt text when media exists", () => {
    const property = makeProperty({
      title: "Apartment with a view",
      media: [
        {
          url: "https://res.cloudinary.com/demo/image.jpg",
          publicId: "img1",
          order: 0,
        },
      ],
    });

    renderWithQueryClient(<PropertyCard property={property} />);

    expect(screen.getByAltText("Apartment with a view")).toBeInTheDocument();
  });

  it.each([
    ["bedrooms", { bedrooms: 3 }, "3 bd"],
    ["bathrooms", { bathrooms: 2 }, "2 ba"],
    ["area", { areaSqm: 150 }, "150 m²"],
  ] as const)(
    "shows %s when present on the property",
    (_label, overrides, expected) => {
      renderWithQueryClient(
        <PropertyCard property={makeProperty(overrides)} />,
      );

      expect(screen.getByText(expected)).toBeInTheDocument();
    },
  );

  it("omits stats the property doesn't have (e.g. land has no bedrooms)", () => {
    renderWithQueryClient(
      <PropertyCard
        property={makeProperty({
          category: "land",
          bedrooms: undefined,
          bathrooms: undefined,
        })}
      />,
    );

    expect(screen.queryByText(/bd$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ba$/)).not.toBeInTheDocument();
  });

  it("toggles the favorite (save) button independently of the card's link", async () => {
    const user = userEvent.setup();
    const property = makeProperty({ id: "fav-1", title: "Save Me House" });

    renderWithQueryClient(<PropertyCard property={property} />);

    const saveButton = screen.getByRole("button", {
      name: "Save Save Me House",
    });
    expect(saveButton).toHaveAttribute("aria-pressed", "false");

    await user.click(saveButton);

    expect(
      await screen.findByRole("button", {
        name: "Remove Save Me House from saved properties",
      }),
    ).toHaveAttribute("aria-pressed", "true");
    // Still exactly one navigable link — the favorite control is a sibling button, not nested inside it.
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
