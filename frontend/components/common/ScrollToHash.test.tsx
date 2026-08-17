import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ScrollToHash } from "./ScrollToHash";

function setHash(hash: string) {
  window.history.replaceState(null, "", hash || "/");
}

afterEach(() => {
  setHash("");
  document.body.innerHTML = "";
});

function mountTarget(id: string) {
  const el = document.createElement("section");
  el.id = id;
  el.scrollIntoView = vi.fn();
  el.focus = vi.fn();
  document.body.appendChild(el);
  return el;
}

describe("ScrollToHash", () => {
  it("scrolls the hash target into view once mounted", () => {
    const target = mountTarget("contact");
    setHash("#contact");

    render(<ScrollToHash />);

    expect(target.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: "start" }),
    );
  });

  it("moves focus to the target so keyboard users follow the scroll", () => {
    const target = mountTarget("contact");
    setHash("#contact");

    render(<ScrollToHash />);

    expect(target.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(target.getAttribute("tabindex")).toBe("-1");
  });

  it("leaves an already-focusable target's tabindex alone", () => {
    const target = mountTarget("contact");
    target.setAttribute("tabindex", "0");
    setHash("#contact");

    render(<ScrollToHash />);

    expect(target.getAttribute("tabindex")).toBe("0");
  });

  it("does nothing when there is no hash", () => {
    const target = mountTarget("contact");
    setHash("");

    render(<ScrollToHash />);

    expect(target.scrollIntoView).not.toHaveBeenCalled();
  });

  it("does nothing when the hash names an element this page doesn't have", () => {
    const target = mountTarget("contact");
    setHash("#nowhere");

    render(<ScrollToHash />);

    expect(target.scrollIntoView).not.toHaveBeenCalled();
  });

  it("jumps instantly rather than smooth-scrolling under reduced motion", () => {
    const target = mountTarget("contact");
    setHash("#contact");
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as unknown as MediaQueryList);

    render(<ScrollToHash />);

    expect(target.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "auto" }),
    );
    vi.restoreAllMocks();
  });
});
