import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RouteError } from "./RouteError";

function renderRouteError(
  overrides: Partial<Parameters<typeof RouteError>[0]> = {},
) {
  const retry = vi.fn();
  render(
    <RouteError
      error={new Error("boom")}
      retry={retry}
      homeHref="/properties"
      homeLabel="Browse properties"
      {...overrides}
    />,
  );
  return retry;
}

describe("RouteError", () => {
  beforeEach(() => {
    // The component logs the error by design; keep the test output readable
    // without suppressing the behaviour itself.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("announces the failure to assistive tech", () => {
    renderRouteError();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Something went wrong.",
    );
  });

  it("offers a retry that re-runs the failed segment", async () => {
    const user = userEvent.setup();
    const retry = renderRouteError();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("offers a route back out of the failed segment", () => {
    renderRouteError();

    expect(
      screen.getByRole("link", { name: "Browse properties" }),
    ).toHaveAttribute("href", "/properties");
  });

  it("never exposes the error message or stack to the user", () => {
    renderRouteError({
      error: Object.assign(
        new Error("connect ECONNREFUSED 127.0.0.1:4000 at Object.fetch"),
        { stack: "at internalFetch (/srv/app/lib/api.ts:42)" },
      ),
    });

    // The whole point of the boundary: a real backend failure will carry
    // hostnames, ports and file paths, none of which belong on screen.
    expect(document.body.textContent).not.toContain("ECONNREFUSED");
    expect(document.body.textContent).not.toContain("127.0.0.1");
    expect(document.body.textContent).not.toContain("lib/api.ts");
  });

  it("shows the digest as an opaque support reference when present", () => {
    renderRouteError({
      error: Object.assign(new Error("boom"), { digest: "abc123def" }),
    });

    expect(screen.getByText("abc123def")).toBeInTheDocument();
  });

  it("omits the reference entirely when there is no digest", () => {
    renderRouteError();

    expect(screen.queryByText(/^Reference:/)).not.toBeInTheDocument();
  });

  it("logs the error so it is recoverable from the console", () => {
    const error = new Error("boom");
    renderRouteError({ error });

    expect(console.error).toHaveBeenCalledWith(error);
  });
});
