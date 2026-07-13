import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeProperty } from "@/test/fixtures";

import { PropertyCard } from "./PropertyCard";

describe("PropertyCard", () => {
  it("renders title, location, and formatted price", () => {
    const property = makeProperty({
      title: "Luxury 3BR Apartment",
      city: "Accra",
      region: "Greater Accra",
      price: 450000,
    });

    render(<PropertyCard property={property} />);

    expect(screen.getByText("Luxury 3BR Apartment")).toBeInTheDocument();
    expect(screen.getByText("Accra, Greater Accra")).toBeInTheDocument();
    expect(screen.getByText("GHS 450,000")).toBeInTheDocument();
  });

  it("links to the property's detail page by slug", () => {
    const property = makeProperty({ slug: "my-test-slug" });

    render(<PropertyCard property={property} />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/properties/my-test-slug",
    );
  });

  it.each([
    ["SALE", "For Sale"],
    ["RENT", "For Rent"],
  ] as const)("shows '%s' listings as '%s'", (listingType, label) => {
    render(<PropertyCard property={makeProperty({ listingType })} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("shows a fallback icon instead of an image when there's no media", () => {
    const property = makeProperty({ media: [] });

    render(<PropertyCard property={property} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders an image with the property title as alt text when media exists", () => {
    const property = makeProperty({
      title: "Apartment with a view",
      media: [
        { url: "https://res.cloudinary.com/demo/image.jpg", publicId: "img1" },
      ],
    });

    render(<PropertyCard property={property} />);

    expect(screen.getByAltText("Apartment with a view")).toBeInTheDocument();
  });
});
