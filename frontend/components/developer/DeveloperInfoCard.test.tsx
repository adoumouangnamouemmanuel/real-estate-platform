import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Developer } from "@/types";

import { DeveloperInfoCard } from "./DeveloperInfoCard";

const developer: Developer = {
  id: "d1",
  slug: "accra-heights",
  name: "Accra Heights",
  city: "Accra",
  region: "Greater Accra",
  isVerified: true,
  rating: 4.8,
  activeListings: 3,
};

describe("DeveloperInfoCard", () => {
  /**
   * Before Stage 6 the property detail page's only contact control was a
   * disabled "Contact on WhatsApp (coming soon)" button — a live listing with
   * no reachable way to contact anyone. The developer's real email already
   * existed on their profile; this routes there explicitly.
   */
  it("offers a named contact route to the developer's profile contact section", () => {
    render(<DeveloperInfoCard developer={developer} />);

    expect(
      screen.getByRole("link", { name: /Contact Accra Heights/ }),
    ).toHaveAttribute("href", "/developers/accra-heights#contact");
  });

  it("still links the developer name to their profile", () => {
    render(<DeveloperInfoCard developer={developer} />);

    expect(screen.getByRole("link", { name: "Accra Heights" })).toHaveAttribute(
      "href",
      "/developers/accra-heights",
    );
  });

  it("shows the Verified badge only when the developer really is verified", () => {
    const { rerender } = render(<DeveloperInfoCard developer={developer} />);
    expect(screen.getByText("Verified")).toBeInTheDocument();

    rerender(
      <DeveloperInfoCard developer={{ ...developer, isVerified: false }} />,
    );
    expect(screen.queryByText("Verified")).not.toBeInTheDocument();
  });

  it("invents no phone number or WhatsApp affordance", () => {
    render(<DeveloperInfoCard developer={developer} />);

    expect(screen.queryByText(/whatsapp/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /tel:/ }),
    ).not.toBeInTheDocument();
  });
});
