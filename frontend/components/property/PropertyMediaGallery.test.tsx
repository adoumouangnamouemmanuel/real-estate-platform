import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { PropertyMedia } from "@/types";

import { PropertyMediaGallery } from "./PropertyMediaGallery";

const media: PropertyMedia[] = [
  { url: "https://example.test/one.jpg", publicId: "one", order: 0 },
  { url: "https://example.test/two.jpg", publicId: "two", order: 1 },
  { url: "https://example.test/three.jpg", publicId: "three", order: 2 },
];

describe("PropertyMediaGallery", () => {
  it("renders one thumbnail per photo, labelled with its position", () => {
    render(<PropertyMediaGallery media={media} title="Test Property" />);

    expect(screen.getByLabelText("Photo 1 of 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Photo 3 of 3")).toBeInTheDocument();
  });

  it("switches the displayed photo when a thumbnail is chosen", async () => {
    const user = userEvent.setup();
    render(<PropertyMediaGallery media={media} title="Test Property" />);

    await user.click(screen.getByLabelText("Photo 2 of 3"));

    expect(screen.getByLabelText("Photo 2 of 3")).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByLabelText("Photo 1 of 3")).not.toHaveAttribute(
      "aria-current",
    );
  });

  /**
   * Focus and "currently showing" are different states, and before this fix the
   * thumbnails had `outline-none` with no focus replacement — so a keyboard user
   * arrowing along the strip saw nothing at all (WCAG 2.4.7). Active keeps the
   * solid border; focus adds the app-standard ring, which renders outside the
   * border box so a thumbnail that is both shows both.
   */
  it("gives thumbnails a focus ring that is distinct from the active-photo border", () => {
    render(<PropertyMediaGallery media={media} title="Test Property" />);

    const active = screen.getByLabelText("Photo 1 of 3");
    const inactive = screen.getByLabelText("Photo 2 of 3");

    // Every thumbnail carries the focus ring, whether or not it is active.
    for (const thumb of [active, inactive]) {
      expect(thumb.className).toContain("focus-visible:ring-3");
      expect(thumb.className).toContain("focus-visible:ring-ring/50");
    }

    // The active state is carried by the border, so the two never collide.
    expect(active.className).toContain("border-primary");
    expect(inactive.className).toContain("border-transparent");
  });

  it("renders a placeholder rather than an empty frame when a property has no photos", () => {
    const { container } = render(
      <PropertyMediaGallery media={[]} title="Test Property" />,
    );

    expect(screen.queryByLabelText(/^Photo /)).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders no thumbnail strip for a single-photo property", () => {
    render(<PropertyMediaGallery media={[media[0]]} title="Test Property" />);

    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });
});
