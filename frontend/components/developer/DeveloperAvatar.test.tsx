import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeveloperAvatar, developerInitials } from "./DeveloperAvatar";

describe("developerInitials", () => {
  it("takes the first and last word's initials", () => {
    expect(developerInitials("Atlantic Properties")).toBe("AP");
    expect(developerInitials("Westgate Developers")).toBe("WD");
  });

  it("skips filler words that would produce a meaningless pair", () => {
    expect(developerInitials("Sanders and Co")).toBe("SC");
    expect(developerInitials("Homes of the North")).toBe("HN");
  });

  it("falls back to two letters for a single-word name", () => {
    expect(developerInitials("Goldcrest")).toBe("GO");
  });

  it("handles stray whitespace and an empty name without throwing", () => {
    expect(developerInitials("  Atlantic   Properties  ")).toBe("AP");
    expect(developerInitials("")).toBe("");
  });
});

describe("DeveloperAvatar", () => {
  /**
   * No developer in the current data model has a `logoUrl`, so the monogram is
   * the real rendering path. It is decorative: the developer's name is always
   * present as text beside it, so announcing the initials too would be noise.
   */
  it("renders initials, hidden from assistive tech, when there is no logo", () => {
    render(<DeveloperAvatar name="Atlantic Properties" />);

    const monogram = screen.getByText("AP");
    expect(monogram).toHaveAttribute("aria-hidden");
  });

  it("renders the logo with an accessible name when one exists", () => {
    render(
      <DeveloperAvatar
        name="Atlantic Properties"
        logoUrl="https://example.test/logo.png"
      />,
    );

    expect(screen.getByAltText("Atlantic Properties logo")).toBeInTheDocument();
    expect(screen.queryByText("AP")).not.toBeInTheDocument();
  });

  it("uses the brand surface for the directory's monogram tone", () => {
    const { container } = render(
      <DeveloperAvatar name="Atlantic Properties" tone="monogram" />,
    );

    expect(container.firstElementChild?.className).toContain("bg-primary");
  });

  it("keeps the quieter muted tone as the inline default", () => {
    const { container } = render(
      <DeveloperAvatar name="Atlantic Properties" />,
    );

    expect(container.firstElementChild?.className).toContain("bg-muted");
  });
});
