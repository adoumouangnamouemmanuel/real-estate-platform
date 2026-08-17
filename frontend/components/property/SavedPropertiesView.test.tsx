import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { renderWithQueryClient } from "@/test/renderWithQueryClient";
import { MOCK_PROPERTIES } from "@/services/mocks/properties.mock";

import { SavedPropertiesView } from "./SavedPropertiesView";

const FAVORITE_IDS_KEY = "lumavok:favorite-property-ids";

// favoriteService reads localStorage directly (see services/favorite.service.ts),
// so seeding storage is how a "browser with saved properties" is set up — no
// second favourites system to stub.
function seedSaved(ids: string[]) {
  window.localStorage.setItem(FAVORITE_IDS_KEY, JSON.stringify(ids));
}

describe("SavedPropertiesView", () => {
  beforeEach(() => window.localStorage.clear());

  it("shows an empty state with a route back to browsing when nothing is saved", async () => {
    renderWithQueryClient(<SavedPropertiesView />);

    await waitFor(() =>
      expect(screen.getByText("Nothing saved yet")).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("link", { name: /Browse properties/ }),
    ).toHaveAttribute("href", "/properties");
  });

  it("resolves saved ids into real property cards", async () => {
    const [first, second] = MOCK_PROPERTIES;
    seedSaved([first.id, second.id]);

    renderWithQueryClient(<SavedPropertiesView />);

    await waitFor(() =>
      expect(screen.getByText(first.title)).toBeInTheDocument(),
    );
    expect(screen.getByText(second.title)).toBeInTheDocument();
  });

  /**
   * The page must not imply an account-synced list — favourites are per-browser
   * localStorage today (favorite.service.ts), and the backend's
   * `property_favorite` table isn't wired up.
   */
  it("states plainly that saves are stored in this browser only", async () => {
    seedSaved([MOCK_PROPERTIES[0].id]);

    renderWithQueryClient(<SavedPropertiesView />);

    await waitFor(() =>
      expect(
        screen.getByText(/stored in this browser only/i),
      ).toBeInTheDocument(),
    );
  });

  it("does not show the browser-storage caveat when there is nothing saved", async () => {
    renderWithQueryClient(<SavedPropertiesView />);

    await waitFor(() =>
      expect(screen.getByText("Nothing saved yet")).toBeInTheDocument(),
    );
    expect(
      screen.queryByText(/stored in this browser only/i),
    ).not.toBeInTheDocument();
  });

  it("removes a property from the list through the same FavoriteButton that added it", async () => {
    const user = userEvent.setup();
    const [first] = MOCK_PROPERTIES;
    seedSaved([first.id]);

    renderWithQueryClient(<SavedPropertiesView />);

    await waitFor(() =>
      expect(screen.getByText(first.title)).toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole("button", {
        name: `Remove ${first.title} from saved properties`,
      }),
    );

    await waitFor(() =>
      expect(screen.queryByText(first.title)).not.toBeInTheDocument(),
    );
    expect(
      JSON.parse(window.localStorage.getItem(FAVORITE_IDS_KEY) ?? "[]"),
    ).toEqual([]);
  });

  it("drops a saved id whose property is no longer listed, without erroring", async () => {
    seedSaved([MOCK_PROPERTIES[0].id, "delisted-property"]);

    renderWithQueryClient(<SavedPropertiesView />);

    await waitFor(() =>
      expect(screen.getByText(MOCK_PROPERTIES[0].title)).toBeInTheDocument(),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
