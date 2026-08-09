import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PropertyDetailView } from "@/components/property/PropertyDetailView";
import { makeProperty, makePropertyDetail } from "@/test/fixtures";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";

describe("Property details flow", () => {
  // favoriteService persists to localStorage (see services/favorite.service.ts).
  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders description, amenities, developer contact, and related properties together", () => {
    const property = makePropertyDetail({
      title: "Luxury 3BR Apartment",
      description: "A beautiful apartment with a view.",
      amenities: ["24/7 Security", "Backup Generator"],
      developer: {
        id: "d1",
        slug: "atlantic-properties",
        name: "Atlantic Properties",
        city: "Accra",
        region: "Greater Accra",
        isVerified: true,
        rating: 4.6,
        activeListings: 6,
      },
    });
    const relatedProperties = [
      makeProperty({ id: "p2", title: "Similar Apartment" }),
    ];

    renderWithQueryClient(
      <PropertyDetailView
        property={property}
        relatedProperties={relatedProperties}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Luxury 3BR Apartment" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("A beautiful apartment with a view."),
    ).toBeInTheDocument();
    expect(screen.getByText("24/7 Security")).toBeInTheDocument();
    expect(screen.getByText("Backup Generator")).toBeInTheDocument();
    expect(screen.getByText("Atlantic Properties")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("Similar Apartment")).toBeInTheDocument();
  });

  it("omits the Amenities section entirely when there are none", () => {
    const property = makePropertyDetail({ amenities: [] });

    renderWithQueryClient(
      <PropertyDetailView property={property} relatedProperties={[]} />,
    );

    expect(
      screen.queryByRole("heading", { name: "Amenities" }),
    ).not.toBeInTheDocument();
  });

  it("omits the Similar Properties section when there are none", () => {
    const property = makePropertyDetail();

    renderWithQueryClient(
      <PropertyDetailView property={property} relatedProperties={[]} />,
    );

    expect(
      screen.queryByRole("heading", { name: "Similar Properties" }),
    ).not.toBeInTheDocument();
  });

  it("shows a disabled WhatsApp CTA while FEATURES.WHATSAPP_CONTACT is off", () => {
    const property = makePropertyDetail();

    renderWithQueryClient(
      <PropertyDetailView property={property} relatedProperties={[]} />,
    );

    const button = screen.getByRole("button", {
      name: /Contact on WhatsApp \(coming soon\)/,
    });
    expect(button).toBeDisabled();
  });

  it("shows '/ month' next to the price only for RENT listings", () => {
    const { rerender } = renderWithQueryClient(
      <PropertyDetailView
        property={makePropertyDetail({ listingType: "RENT", price: 3000 })}
        relatedProperties={[]}
      />,
    );
    expect(screen.getByText("/ month")).toBeInTheDocument();

    rerender(
      <PropertyDetailView
        property={makePropertyDetail({ listingType: "SALE", price: 300000 })}
        relatedProperties={[]}
      />,
    );
    expect(screen.queryByText("/ month")).not.toBeInTheDocument();
  });
});
