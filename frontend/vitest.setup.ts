import "@testing-library/jest-dom/vitest";

// Initialize i18n for tests
import "@/lib/i18n";

// jsdom doesn't implement matchMedia — components reading prefers-reduced-motion
// (see hooks/useReducedMotion.ts, used by the motion primitives in components/motion)
// would otherwise throw as soon as they're rendered in a test. Default to "no
// preference" (matches: false), the same fallback getServerSnapshot already uses.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// jsdom also doesn't implement IntersectionObserver, which MotionReveal's
// whileInView (components/motion/MotionReveal.tsx) depends on to trigger
// scroll reveals. Tests don't need real intersection behavior — content is
// still present in the DOM regardless of the (never-fired) reveal — they
// just need the constructor to exist so mounting doesn't throw.
if (typeof window !== "undefined" && !window.IntersectionObserver) {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  const mockObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
  window.IntersectionObserver = mockObserver;
  globalThis.IntersectionObserver = mockObserver;
}
