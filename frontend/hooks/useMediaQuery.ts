import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query from JS, using the same
 * `useSyncExternalStore` shape as `useReducedMotion` (its
 * `getServerSnapshot` returns the desktop/"no match" answer, so SSR and the
 * first client paint agree and React can correct after hydration without a
 * mismatch error).
 *
 * Use this only where the two branches must not both exist in the DOM at
 * once — e.g. the dashboard's table-vs-card presentations, where rendering
 * both behind `hidden`/`md:` classes would duplicate every row's accessible
 * name and its interactive controls. Plain responsive Tailwind classes remain
 * the right tool for everything that is purely visual.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", callback);
      return () => list.removeEventListener("change", callback);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/**
 * Below Tailwind's `md` (48rem/768px) — the same breakpoint at which
 * DashboardSidebar hides and DashboardMobileNav takes over, so the dashboard
 * only ever has one navigation and one table/card presentation at a time.
 */
export const MOBILE_MEDIA_QUERY = "(max-width: 767.98px)";
