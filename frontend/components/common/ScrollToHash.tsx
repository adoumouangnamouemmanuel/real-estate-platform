"use client";

import { useEffect } from "react";

/**
 * Scrolls to `location.hash` when the content that owns the target actually
 * mounts.
 *
 * Next's App Router applies a `#hash` scroll as soon as a navigation commits.
 * On a route that has its own `loading.tsx` — which `/developers/[slug]` does —
 * that moment lands while the loading UI is mounted, so the target element
 * doesn't exist yet, the scroll is a no-op, and the router never retries once
 * the real content streams in. Measured on the built app: after a client-side
 * navigation to `/developers/[slug]#contact`, the loading boundary held the
 * page for ~700ms, `#contact` only appeared afterwards, and `scrollY` stayed 0
 * — the visitor landed at the top of the profile instead of at the contact
 * details. A hard load of the same URL scrolled correctly, because there the
 * browser's own fragment handling runs against the finished document.
 *
 * Rendering this alongside the real content guarantees the target exists by the
 * time we scroll. It is a no-op when there is no hash, or when the hash names
 * something this page doesn't have.
 */
export function ScrollToHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace("#", ""));
    if (!id) return;

    const target = document.getElementById(id);
    if (!target) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });

    // Move focus too, not just the viewport: a hard load's native fragment
    // navigation does this for free, and without it a keyboard or screen-reader
    // user following the same link would be scrolled somewhere their focus
    // hasn't gone. `tabIndex=-1` makes a non-interactive section focusable
    // without adding it to the tab order; it's removed again on blur so the
    // page is left exactly as it was found.
    const hadTabIndex = target.hasAttribute("tabindex");
    if (!hadTabIndex) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    if (!hadTabIndex) {
      target.addEventListener(
        "blur",
        () => target.removeAttribute("tabindex"),
        { once: true },
      );
    }
  }, []);

  return null;
}
