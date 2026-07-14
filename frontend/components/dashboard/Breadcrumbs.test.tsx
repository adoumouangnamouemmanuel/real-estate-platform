import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Breadcrumbs } from "./Breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders nothing for an empty item list", () => {
    const { container } = render(<Breadcrumbs items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("links every item except the last", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "My Properties", href: "/listings" },
          { label: "Luxury 3BR Apartment", href: "/listings/abc" },
          { label: "Edit" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "My Properties" })).toHaveAttribute(
      "href",
      "/listings",
    );
    expect(
      screen.getByRole("link", { name: "Luxury 3BR Apartment" }),
    ).toHaveAttribute("href", "/listings/abc");
    expect(
      screen.queryByRole("link", { name: "Edit" }),
    ).not.toBeInTheDocument();
  });

  it("marks the last item as the current page", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "My Properties", href: "/listings" },
          { label: "Edit" },
        ]}
      />,
    );

    expect(screen.getByText("Edit")).toHaveAttribute("aria-current", "page");
  });

  it("does not link the last item even if it has an href", () => {
    render(
      <Breadcrumbs items={[{ label: "My Properties", href: "/listings" }]} />,
    );

    expect(
      screen.queryByRole("link", { name: "My Properties" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("My Properties")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
