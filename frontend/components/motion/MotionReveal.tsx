"use client";

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";

import { revealVariants, staggerContainer } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type RevealTag =
  | "div"
  | "section"
  | "header"
  | "aside"
  | "article"
  | "ul"
  | "li"
  | "h1"
  | "h2"
  | "h3"
  | "p"
  | "span";

type MotionRevealProps = {
  as?: RevealTag;
  /** Wrap children that each render their own MotionReveal to stagger them. */
  stagger?: boolean;
  /** Re-run the reveal every time this scrolls into view, instead of once. */
  once?: boolean;
  variants?: Variants;
} & HTMLMotionProps<"div">;

/**
 * Scroll/mount reveal used for section-level entrances across the site
 * (property sections, dashboard widgets, editorial copy blocks). For
 * reduced-motion users it renders straight into the "visible" state instead
 * of animating — content is never hidden waiting on a scroll trigger.
 */
export function MotionReveal({
  as = "div",
  stagger = false,
  once = true,
  variants,
  ...props
}: MotionRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const resolvedVariants =
    variants ?? (stagger ? staggerContainer : revealVariants);
  // `motion` is a Proxy covering every intrinsic element; `as` only ever
  // selects among plain container/text tags, so div's prop shape is a safe
  // stand-in here.
  const Component = motion[as] as typeof motion.div;

  if (prefersReducedMotion) {
    return (
      <Component
        data-motion-reveal
        // `initial={false}` (not "visible") tells framer to mount at the target
        // values without running an enter animation at all, and duration 0
        // collapses any transition it would otherwise inherit. Previously this
        // branch used initial/animate="visible", which still animated: the
        // element had already begun fading from the render below, so framer
        // eased it to 1 rather than snapping — measured at opacity 0.62 200ms
        // in, settling only after the full 600ms reveal duration.
        initial={false}
        animate="visible"
        transition={{ duration: 0 }}
        variants={resolvedVariants}
        {...props}
      />
    );
  }

  return (
    <Component
      data-motion-reveal
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-80px" }}
      variants={resolvedVariants}
      {...props}
    />
  );
}

/** Use inside a stagger MotionReveal for each child that should stagger in. */
export function MotionRevealItem({
  as = "div",
  variants,
  ...props
}: { as?: RevealTag; variants?: Variants } & HTMLMotionProps<"div">) {
  const prefersReducedMotion = useReducedMotion();
  const Component = motion[as] as typeof motion.div;

  // Items previously ignored the setting entirely and inherited the parent's
  // stagger, so each one was delayed by 80ms * its index even for users who had
  // asked for no motion. Opting out here as well means the last item in a long
  // grid appears at the same instant as the first.
  if (prefersReducedMotion) {
    return (
      <Component
        data-motion-reveal
        initial={false}
        animate="visible"
        transition={{ duration: 0 }}
        variants={variants ?? revealVariants}
        {...props}
      />
    );
  }

  return (
    <Component
      data-motion-reveal
      variants={variants ?? revealVariants}
      {...props}
    />
  );
}
