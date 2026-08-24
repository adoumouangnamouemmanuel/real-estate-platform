import { useSyncExternalStore } from "react";

/**
 * True when either the OS asks for reduced motion or the app's own
 * accessibility preference does.
 *
 * Both signals are read from the DOM rather than from React state on purpose:
 * `document.documentElement.dataset.motion` is set by the pre-paint script in
 * app/layout.tsx, so this returns the correct answer on the very first client
 * render — before PreferencesProvider has mounted. Routing the app preference
 * through context instead would make it arrive a render late, which is the
 * exact failure mode the [data-motion-reveal] CSS guarantee exists to prevent.
 *
 * This deliberately extends the single existing motion architecture rather than
 * adding a parallel one: MotionReveal/MotionRevealItem keep calling this one
 * hook, and gain the app preference for free.
 */
function subscribe(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);

  // The app preference changes by attribute mutation, which emits no event of
  // its own — observe it so a change in the accessibility panel re-renders
  // motion consumers immediately.
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-motion"],
  });

  return () => {
    query.removeEventListener("change", callback);
    observer.disconnect();
  };
}

function getSnapshot() {
  const systemPrefers = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const appPrefers = document.documentElement.dataset.motion === "reduced";
  return systemPrefers || appPrefers;
}

function getServerSnapshot() {
  return false;
}

/**
 * Tracks the effective reduced-motion setting for JS-driven motion
 * (scroll-triggered reveals, count-up, etc.) that CSS's blanket
 * transition-duration override in globals.css can't reach on its own.
 */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
