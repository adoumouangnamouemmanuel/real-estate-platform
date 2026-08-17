import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NavbarLinks } from "./NavbarLinks";

const usePathname = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ usePathname }));

describe("NavbarLinks", () => {
  it("renders every public destination, including Saved", () => {
    usePathname.mockReturnValue("/");
    render(<NavbarLinks />);

    expect(
      screen.getByRole("link", { name: "Properties" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Developers" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Saved" })).toHaveAttribute(
      "href",
      "/saved",
    );
    expect(screen.getByRole("link", { name: "Search" })).toBeInTheDocument();
  });

  it("marks the current route with aria-current=page", () => {
    usePathname.mockReturnValue("/properties");
    render(<NavbarLinks />);

    expect(screen.getByRole("link", { name: "Properties" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Developers" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("keeps a section active on its nested routes", () => {
    usePathname.mockReturnValue("/properties/luxury-3br-apartment-east-legon");
    render(<NavbarLinks />);

    expect(screen.getByRole("link", { name: "Properties" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks nothing active on a route outside the nav", () => {
    usePathname.mockReturnValue("/login");
    render(<NavbarLinks />);

    for (const name of ["Properties", "Developers", "Saved", "Search"]) {
      expect(screen.getByRole("link", { name })).not.toHaveAttribute(
        "aria-current",
      );
    }
  });

  it("signals the active link by weight as well as colour, not colour alone", () => {
    usePathname.mockReturnValue("/saved");
    render(<NavbarLinks />);

    // WCAG 1.4.1: colour must not be the only visual channel carrying meaning.
    expect(screen.getByRole("link", { name: "Saved" }).className).toContain(
      "font-medium",
    );
  });
});
