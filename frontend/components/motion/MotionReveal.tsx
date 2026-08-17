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
        initial="visible"
        animate="visible"
        variants={resolvedVariants}
        {...props}
      />
    );
  }

  return (
    <Component
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
  const Component = motion[as] as typeof motion.div;
  return <Component variants={variants ?? revealVariants} {...props} />;
}
