import type { Transition, Variants } from "framer-motion";

/**
 * JS-side mirror of the CSS motion tokens in app/globals.css. Keep the two
 * in sync — these drive framer-motion transitions, the CSS custom
 * properties drive plain Tailwind transition utilities.
 */
export const EASE_CINEMATIC: Transition["ease"] = [0.16, 1, 0.3, 1];
export const EASE_STANDARD: Transition["ease"] = [0.4, 0, 0.2, 1];

export const DURATION_FAST = 0.15;
export const DURATION_BASE = 0.3;
export const DURATION_SLOW = 0.6;
export const DURATION_CINEMATIC = 1.2;

/** Fade + rise-in, the default scroll-reveal pattern used across the site. */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION_SLOW, ease: EASE_CINEMATIC },
  },
};

/** Applied to a reveal container to stagger its direct children. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};
